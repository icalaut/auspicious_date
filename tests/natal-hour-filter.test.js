function runNatalHourFilterTests({ evaluateNatalHour, filterMoveInHoursByNatals, birthChartRows, birthChartColumns }) {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  function owner(natal, index = 0) {
    return { index, yearPillar: natal, natalRow: birthChartRows.find((row) => row[0] === natal) };
  }
  function date(hours, pillar = "甲辰") {
    return { dateKey: "2027-02-06", dayPillar: pillar, needsReview: true,
      rows: [{ "日柱": pillar, "吉时": hours, "来源页": "test source" }] };
  }
  const rat = owner("甲子");
  const tiger = owner("丙寅", 1);
  check("Branch benefit accepted", evaluateNatalHour("亥", rat).accepted);
  check("Hour labels used", evaluateNatalHour("亥", rat).benefits.some((text) => text.includes("時支")));
  check("Clash excluded", !evaluateNatalHour("午", rat).accepted
    && evaluateNatalHour("午", rat).avoid.some((text) => text.startsWith("相沖")));
  check("Sha overrides benefit", !evaluateNatalHour("未", rat).accepted
    && evaluateNatalHour("未", rat).benefits.length > 0);
  check("Punishment overrides benefit", !evaluateNatalHour("卯", rat).accepted
    && evaluateNatalHour("卯", rat).avoid.some((text) => text.startsWith("三刑")));
  check("Neutral branch excluded", !evaluateNatalHour("子", rat).accepted);
  check("One horse branch qualifies hour", evaluateNatalHour("辰", tiger).accepted
    && evaluateNatalHour("辰", tiger).benefits.some((text) => text.startsWith("進馬"))
    && !evaluateNatalHour("辰", tiger).deferred.some((text) => text.startsWith("進馬")));
  const horseOnlyRow = [...tiger.natalRow];
  for (let index = 2; index < 14; index += 1) horseOnlyRow[index] = "";
  horseOnlyRow[birthChartColumns.indexOf("進馬")] = "巳酉丑";
  for (const branch of "子丑寅卯辰巳午未申酉戌亥") {
    const match = evaluateNatalHour(branch, { ...tiger, natalRow: horseOnlyRow });
    check(`${branch} horse-only matching`, match.benefits.length === ("巳酉丑".includes(branch) ? 1 : 0));
    check(`${branch} horse cannot override taboo`, match.accepted === (match.avoid.length === 0 && "巳酉丑".includes(branch)));
  }
  horseOnlyRow[birthChartColumns.indexOf("進馬")] = "巳酉丑全";
  check("Unrecognized horse text still deferred", evaluateNatalHour("酉", { ...tiger, natalRow: horseOnlyRow })
    .deferred.some((text) => text.startsWith("進馬")));
  check("Arrow not single-branch prohibition", evaluateNatalHour("酉", rat).avoid.length === 0);
  check("Invalid branch blocked", Boolean(evaluateNatalHour("甲", rat).error));
  check("Full pillar not interpreted as branch", Boolean(evaluateNatalHour("甲子", rat).error));
  check("Empty branch blocked", Boolean(evaluateNatalHour("", rat).error));
  check("Missing natal blocked", Boolean(evaluateNatalHour("亥", { index: 0 }).error));
  const stemOnlyRow = [...rat.natalRow];
  for (let index = 2; index < 14; index += 1) stemOnlyRow[index] = "乙己";
  check("No invented hour stem benefit", !evaluateNatalHour("亥", { ...rat, natalRow: stemOnlyRow }).accepted);
  const blankRow = [...rat.natalRow];
  for (let index = 2; index < 14; index += 1) blankRow[index] = "";
  check("Blank benefits not invented", !evaluateNatalHour("亥", { ...rat, natalRow: blankRow }).accepted);
  const missingAvoid = [...rat.natalRow];
  missingAvoid[birthChartColumns.indexOf("三殺")] = "";
  check("Missing taboo field blocks hour", Boolean(evaluateNatalHour("亥", { ...rat, natalRow: missingAvoid }).error));
  check("No owners blocked", Boolean(filterMoveInHoursByNatals([date("亥")], []).error));
  const input = date("丑、亥、申、卯、未、午、子");
  const before = JSON.stringify(input);
  const single = filterMoveInHoursByNatals([input], [rat]);
  check("Single owner retains favorable branches", single.accepted[0].hourRows[0].keptHours.map((h) => h.branch).join() === "丑,亥,申");
  const multi = filterMoveInHoursByNatals([input], [rat, tiger]);
  const row = multi.accepted[0].hourRows[0];
  check("Every owner must benefit", row.keptHours.map((h) => h.branch).join() === "亥");
  check("All rejected branches reported", row.excludedHours.length === 6);
  check("Specific second-owner clash reported", row.excludedHours.find((h) => h.branch === "申").exclusionReason.includes("屋主 2：時支避忌 相沖"));
  check("Specific neutral-owner reason reported", row.excludedHours.find((h) => h.branch === "丑").exclusionReason.includes("屋主 2：未命中"));
  check("No mutation of source", before === JSON.stringify(input));
  check("Source metadata preserved", row.row["来源页"] === "test source");
  check("Draft remains draft", multi.accepted[0].needsReview);
  check("Hours retain conventional ranges", row.keptHours[0].range === "21:00–22:59");
  const none = filterMoveInHoursByNatals([date("午、未、卯")], [rat]);
  check("No good hours removes date", none.accepted.length === 0 && none.excluded.length === 1);
  check("Removed-date reasons kept", none.excluded[0].exclusionReason.includes("相沖")
    && none.excluded[0].exclusionReason.includes("三殺") && none.excluded[0].exclusionReason.includes("三刑"));
  check("Conditional prose cannot create hours", filterMoveInHoursByNatals([date("忌亥時")], [rat]).accepted.length === 0);
  check("Missing hours removes date", filterMoveInHoursByNatals([date("")], [rat]).excluded[0].exclusionReason.includes("不可補造"));
  const duplicate = date("亥、亥、丑");
  check("No invented or duplicate hours", filterMoveInHoursByNatals([duplicate], [rat, tiger]).accepted[0].hourRows[0].keptHours.length === 1);
  const conflict = date("亥");
  conflict.rows[0]["日柱"] = "甲子";
  check("Day conflict still blocked", filterMoveInHoursByNatals([conflict], [rat]).accepted.length === 0);
  check("Date-level taboo cannot be bypassed", filterMoveInHoursByNatals([date("亥", "庚午")], [rat]).accepted.length === 0);
  const pig = owner("乙亥");
  const zi = evaluateNatalHour("子", pig);
  if (zi.accepted) {
    check("Zi can pass branch only", zi.benefits.every((text) => text.includes("時支")));
  } else {
    check("Zi evaluated without choosing date boundary", !zi.error);
  }
  for (const natalRow of birthChartRows) {
    const current = { index: 0, yearPillar: natalRow[0], natalRow };
    for (const branch of "子丑寅卯辰巳午未申酉戌亥") {
      const match = evaluateNatalHour(branch, current);
      check(`${natalRow[0]} ${branch} shape valid`, !match.error);
      check(`${natalRow[0]} ${branch} strict rule`,
        match.accepted === (match.avoid.length === 0 && match.benefits.length > 0));
    }
  }
  return { passed };
}
