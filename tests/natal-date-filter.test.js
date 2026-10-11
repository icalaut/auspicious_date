function runNatalDateFilterTests({ evaluateNatalDate, filterMoveInDatesByNatals, birthChartRows }) {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  function owner(natal, index = 0) {
    return { yearPillar: natal, natalRow: birthChartRows.find((row) => row[0] === natal), index };
  }
  function result(pillar, source = pillar) {
    return { dayPillar: pillar, rows: [{ "日柱": source, "吉时": "卯、巳" }], needsReview: true };
  }
  const rat = owner("甲子");
  const tiger = owner("丙寅", 1);
  const triad = evaluateNatalDate("庚辰", rat);
  check("Branch triad matches", triad.accepted && triad.benefits.some((text) => text.startsWith("三合")));
  check("Stem benefit matches", evaluateNatalDate("乙酉", rat).benefits.some((text) => text.startsWith("進貴")));
  check("Clash excluded", !evaluateNatalDate("庚午", rat).accepted
    && evaluateNatalDate("庚午", rat).avoid.some((text) => text.startsWith("相沖")));
  const sha = evaluateNatalDate("乙未", rat);
  check("Benefits cannot override sha", sha.benefits.length > 0 && !sha.accepted
    && sha.avoid.some((text) => text.startsWith("三殺")));
  check("Punishment excludes despite benefit", !evaluateNatalDate("丁卯", rat).accepted
    && evaluateNatalDate("丁卯", rat).avoid.some((text) => text.startsWith("三刑")));
  check("Neutral date accepted", evaluateNatalDate("庚子", rat).accepted
    && evaluateNatalDate("庚子", rat).benefits.length === 0);
  check("One of three horse branches counts", evaluateNatalDate("庚辰", tiger).benefits.some((text) => text.startsWith("進馬"))
    && !evaluateNatalDate("庚辰", tiger).deferred.some((text) => text.startsWith("進馬")));
  const pig = owner("乙亥");
  for (const pillar of ["己巳", "癸酉", "乙丑"]) {
    const match = evaluateNatalDate(pillar, pig);
    check(`${pillar} matches 巳酉丑 horse`, match.benefits.includes(`進馬（日支 ${pillar[1]}；原表 巳酉丑）`)
      && !match.deferred.some((text) => text.startsWith("進馬")));
  }
  check("Horse cannot override clash", !evaluateNatalDate("己巳", pig).accepted);
  check("Outside horse group not matched", !evaluateNatalDate("庚辰", pig).benefits.some((text) => text.startsWith("進馬")));
  const combinationRow = [...tiger.natalRow];
  combinationRow[2] = "巳酉丑";
  check("Other three-branch groups still deferred", evaluateNatalDate("癸酉", { ...tiger, natalRow: combinationRow })
    .deferred.some((text) => text.startsWith("三合")));
  check("Invalid sexagenary pair blocked", Boolean(evaluateNatalDate("甲丑", rat).error));
  check("Invalid pillar blocked", Boolean(evaluateNatalDate("", rat).error));
  check("Missing natal blocked", Boolean(evaluateNatalDate("庚辰", { index: 0 }).error));
  const missingAvoid = [...rat.natalRow];
  missingAvoid[14] = "";
  check("Missing clash field blocked", Boolean(evaluateNatalDate("庚辰", { ...rat, natalRow: missingAvoid }).error));
  check("No owners blocked", Boolean(filterMoveInDatesByNatals([result("庚辰")], []).error));
  check("Unresolved owner blocked", Boolean(filterMoveInDatesByNatals([result("庚辰")], [{ error: "missing" }]).error));
  check("Neutral second owner allowed", filterMoveInDatesByNatals([result("庚辰")], [rat, tiger]).accepted.length === 1);
  check("Any owner taboo still excludes", filterMoveInDatesByNatals([result("庚申")], [rat, tiger]).accepted.length === 0);
  const goat = owner("己未");
  check("Reported 壬寅 date now accepted", evaluateNatalDate("壬寅", goat).accepted
    && evaluateNatalDate("壬寅", goat).benefits.length === 0);
  check("Reported 壬寅 source preserved", filterMoveInDatesByNatals([result("壬寅")], [goat]).accepted.length === 1);
  const both = filterMoveInDatesByNatals([result("甲辰")], [rat, tiger]);
  check("Both owners benefiting accepted", both.accepted.length === 1 && both.accepted[0].ownerMatches.length === 2);
  check("Unconfirmed remains review only", both.accepted[0].needsReview);
  check("Original hours preserved without filtering", both.accepted[0].rows[0]["吉时"] === "卯、巳");
  check("Mismatched source pillar not evaluated", filterMoveInDatesByNatals([result("庚辰", "甲子")], [rat]).excluded[0].exclusionReason.includes("日柱"));
  check("Missing source pillar not evaluated", filterMoveInDatesByNatals([result("庚辰", "")], [rat]).accepted.length === 0);
  check("Combination arrow not rejected on one branch", evaluateNatalDate("乙酉", rat).accepted);
  const conflicting = result("庚辰");
  conflicting.rows.push({ "日柱": "甲子" });
  check("One conflicting duplicate source blocks whole date",
    filterMoveInDatesByNatals([conflicting], [rat]).accepted.length === 0);
  check("Input source rows never modified", both.accepted[0].rows[0]["日柱"] === "甲辰");
  const malformedOwner = { ...tiger, natalRow: [] };
  check("Broken second owner cannot be ignored",
    filterMoveInDatesByNatals([result("甲辰")], [rat, malformedOwner]).accepted.length === 0);
  check("Broken second owner named in reason",
    filterMoveInDatesByNatals([result("甲辰")], [rat, malformedOwner]).excluded[0].exclusionReason.includes("屋主 2"));
  return { passed };
}
