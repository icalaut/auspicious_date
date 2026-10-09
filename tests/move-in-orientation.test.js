function runMoveInOrientationTests({ matchMoveInCourseRows, dateSearchSittingForRow, dayPillarForDate, moveInCourseHours }) {
  const passed = [];
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed.push(name);
  }
  function row(date, sitting = "坐北向南", overrides = {}) {
    return {
      "坐向类别": sitting,
      "月令": "正月",
      "公历日期": date,
      "日柱": dayPillarForDate(...date.split("-").map(Number)),
      "校对状态": "confirmed",
      ...overrides
    };
  }
  const north = row("2027-02-08");
  const south = row("2027-02-09", "坐南向北");
  const east = row("2027-02-10", "坐东向西");
  for (const [sitting, expected] of [["坐北", north], ["坐南", south], ["坐東", east]]) {
    const result = matchMoveInCourseRows([north, south, east], sitting);
    check(`${sitting} matches only its own course`, result.results.length === 1
      && result.results[0].dateKey === expected["公历日期"]);
  }
  for (const sitting of ["坐西", "坐東北", "坐東南", "坐西南", "坐西北", "unsupported", ""]) {
    check(`Unsupported sitting ${sitting} blocks`, Boolean(matchMoveInCourseRows([north], sitting).error));
  }
  for (const source of ["坐东北向西南", "坐東南向西北", "坐西南向東北"]) {
    check(`No neighbouring direction fallback: ${source}`, dateSearchSittingForRow({ "坐向类别": source }) === "");
  }
  for (const status of ["", "draft", "待校對", "未校对", "第一版人工转录；建议程序上线前逐格复核"]) {
    const result = matchMoveInCourseRows([row("2027-02-08", undefined, { "校对状态": status })], "坐北");
    check(`Unconfirmed status ${status} displayed for review`, result.results.length === 1
      && result.counts.unconfirmed === 1 && result.results[0].needsReview);
  }
  for (const status of ["confirmed", "已校對", "已校对"]) {
    check(`Explicit confirmation ${status} accepted`, matchMoveInCourseRows([
      row("2027-02-08", undefined, { "校对状态": status })
    ], "坐北").results.length === 1);
  }
  check("Confirmed pillar mismatch counted", matchMoveInCourseRows([
    row("2027-02-08", undefined, { "日柱": "甲子" })
  ], "坐北").counts.mismatch === 1);
  check("Missing pillar displayed for review", matchMoveInCourseRows([
    row("2027-02-08", undefined, { "日柱": "" })
  ], "坐北").results[0].needsReview);
  const mismatch = matchMoveInCourseRows([row("2027-02-08", undefined, { "日柱": "甲子" })], "坐北");
  check("Mismatched source pillar is preserved and marked", mismatch.results[0].needsReview
    && mismatch.results[0].rows[0]["日柱"] === "甲子");
  check("Wrong calendar year excluded", matchMoveInCourseRows([row("2028-02-08")], "坐北").counts.invalid === 1);
  check("Missing month excluded", matchMoveInCourseRows([
    row("2027-02-08", undefined, { "月令": "" })
  ], "坐北").counts.invalid === 1);
  check("Explicit row prohibition overrides confirmation", matchMoveInCourseRows([
    row("2027-02-08", undefined, { "状态": "HARD REJECT" })
  ], "坐北").counts.rejected === 1);
  const rule = { "坐向类别": "坐北向南", "月令": "正月", "状态": "HARD REJECT" };
  check("Monthly prohibition overrides confirmed date", matchMoveInCourseRows([north, rule], "坐北").results.length === 0);
  check("Other sitting prohibition does not exclude", matchMoveInCourseRows([
    south, rule
  ], "坐南").results.length === 1);
  check("Uncertain monthly range remains blocked", matchMoveInCourseRows([
    north, { ...rule, "校对状态": "需逐格确认适用日期范围" }
  ], "坐北").uncertainMonths[0] === 1);
  check("Unidentified prohibited month blocks sitting", Boolean(matchMoveInCourseRows([
    north, { ...rule, "月令": "" }
  ], "坐北").error));
  check("Missing hours do not pre-filter dates", matchMoveInCourseRows([north], "坐北").results.length === 1);
  check("January is included in the full calendar year", matchMoveInCourseRows([row("2027-01-01")], "坐北").results.length === 1);
  const sorted = matchMoveInCourseRows([row("2027-12-08"), north, north], "坐北").results;
  check("Full year sorted and duplicate dates grouped", sorted.length === 2 && sorted[0].dateKey === "2027-02-08"
    && sorted[0].rows.length === 2);
  check("Missing sitting data blocks", Boolean(matchMoveInCourseRows([north], "坐南").error));
  check("Unsupported sitting reports book-specific unavailable dates",
    matchMoveInCourseRows([north], "坐西").error.includes("2027 年此住宅坐向無可取用好日期"));
  const hours = moveInCourseHours("丑、卯、巳");
  check("All and only listed hours returned", hours.hours.map((hour) => hour.branch).join("") === "丑卯巳");
  check("Hour ranges correct", hours.hours.map((hour) => hour.range).join(",") === "01:00–02:59,05:00–06:59,09:00–10:59");
  check("Duplicate branch shown once", moveInCourseHours("卯時、卯、辰时").hours.length === 2);
  check("Missing hours remain unavailable", moveInCourseHours("").hours.length === 0 && Boolean(moveInCourseHours("").warning));
  check("Unrecognized conditions cannot invent permitted hours",
    moveInCourseHours("忌午時").hours.length === 0 && Boolean(moveInCourseHours("忌午時").warning));
  check("Midnight branch flags unresolved date boundary", moveInCourseHours("子").hours[0].range.includes("日界待核"));
  const twelve = moveInCourseHours("子丑寅卯辰巳午未申酉戌亥");
  check("Twelve listed branches all preserved", twelve.hours.length === 12 && twelve.hours[11].range === "21:00–22:59");
  return { passed: passed.length };
}
