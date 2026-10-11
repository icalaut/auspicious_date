function runBedCourseTests({ filterBedCourses, dayPillarForDate, BIRTH_CHART_COLUMNS,
  courseHourPillar, courseDegreesMatch, solarTermMoment }) {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  const date = "2027-02-08";
  const pillar = dayPillarForDate(2027, 2, 8);
  const natalRow = BIRTH_CHART_COLUMNS.map((column) =>
    ["相沖", "三殺", "三刑"].includes(column) ? "亥" : "");
  natalRow[0] = "甲子";
  const people = [{ index: 0, yearPillar: "甲子", natalRow }];
  const row = { "坐向": "坐南", "月令": "正月", "公历日期": date, "日柱": pillar,
    "吉时原文": "卯、巳", "附注 / 尾注": "节后传", "吉时编号": "密" };
  const review = { "公历日期": date, "住宅坐向": "午山子向", "屋前角度": "0",
    "屋後角度": "180", "床位角度": "90", "床頭角度": "270", "用床者年柱": "甲子",
    "校对状态": "confirmed", "原表尾注": "已核对无禁忌", "山家床向": "已核对无禁忌",
    "日课组合": "已核对无禁忌", "床位飞星": "已核对无禁忌", "来源": "原书 p.117–118" };
  const stars = () => ({ sitting: "E", yearPillar: "丁未", monthPillar: "壬寅",
    cells: ["E", "S", "W"].map((palace) => ({ palace, label: palace,
      yearStar: 1, monthStar: 2, dayStar: 3, hourStar: 4 })) });
  const options = { frontDegree: 0, rearDegree: 180, headDegree: 270,
    starCalculator: stars, solarFilter: () => ({ accepted: [], excluded: [] }) };
  const run = (rows = [row], reviews = [review], degree = 90, extra = {}, persons = people) =>
    filterBedCourses(rows, reviews, "坐南", "午", "午山子向", degree, persons, { ...options, ...extra });
  const good = run();
  check("Fully reviewed neutral date accepted", good.accepted.length === 1 && good.accepted[0].usable);
  check("All and only original hours kept", good.accepted[0].hourRows[0].keptHours.map((hour) => hour.branch).join("") === "卯巳");
  check("Neutral natal hour needs no benefit", good.accepted[0].hourRows[0].keptHours.every((hour) => hour.ownerMatches[0].benefits.length === 0));
  check("Solar no-match is not a rejection", good.accepted[0].solarRank === 5 && good.accepted[0].usable);
  check("No reviews yields pending candidates", !run([row], []).accepted[0].usable);
  check("Primary confirmation alone cannot certify tails or bed direction", !run([{ ...row, "校对状态": "confirmed" }], []).accepted[0].usable);
  for (const field of Object.keys(review)) {
    check(`Missing review ${field} never certifies`, !run([row], [{ ...review, [field]: "" }]).accepted[0].usable);
  }
  for (const field of ["原表尾注", "山家床向", "日课组合", "床位飞星"]) {
    check(`${field} confirmed prohibition excludes`, run([row], [{ ...review, [field]: "禁安床" }]).accepted.length === 0);
    check(`${field} unrecognized decision cannot certify`, !run([row], [{ ...review, [field]: "looks okay" }]).accepted[0].usable);
  }
  for (const status of ["confirmed", "已校对", "已校對"]) {
    check(`Explicit review ${status} accepted`, run([row], [{ ...review, "校对状态": status }]).accepted[0].usable);
  }
  check("Duplicate reviews pending", !run([row], [review, review]).accepted[0].usable);
  for (const [key, value] of [["frontDegree", 1], ["rearDegree", 181], ["headDegree", 271]]) {
    check(`Changing ${key} invalidates review`, !run([row], [review], 90, { [key]: value }).accepted[0].usable);
  }
  check("Changing bed position invalidates review", !run([row], [review], 91).accepted[0].usable);
  check("Missing people rejected", Boolean(run([row], [review], 90, {}, []).error));
  check("Unresolved person rejected", Boolean(run([row], [review], 90, {}, [{ error: "missing" }]).error));
  const badNatal = [...natalRow];
  badNatal[BIRTH_CHART_COLUMNS.indexOf("相沖")] = pillar[1];
  const badPerson = { index: 1, yearPillar: "甲子", natalRow: badNatal };
  const two = run([row], [], 90, {}, [...people, badPerson]);
  check("Any second user taboo rejects", two.excluded.length === 1 && two.excluded[0].exclusionReason.includes("用床者 2"));
  const badHourNatal = [...natalRow];
  badHourNatal[BIRTH_CHART_COLUMNS.indexOf("三刑")] = "卯";
  const hourFiltered = run([row], [], 90, {}, [{ ...people[0], natalRow: badHourNatal }]);
  check("Hour taboo checked independently", hourFiltered.accepted[0].hourRows[0].keptHours.map((hour) => hour.branch).join("") === "巳");
  check("Source pillar missing rejects", run([{ ...row, "日柱": "" }]).accepted.length === 0);
  check("Conflicting duplicate pillar rejects whole date", run([row, { ...row, "日柱": "甲子" }]).accepted.length === 0);
  check("Missing original times not invented", run([{ ...row, "吉时原文": "" }]).accepted.length === 0);
  check("Wrong topic hour column never substituted", run([{ ...row, "吉时原文": "", "吉时": "卯" }]).accepted.length === 0);
  check("Manual permission does not create hours", run([{ ...row, "吉时原文": "其余良时可自取选用" }]).accepted.length === 0);
  check("Conditional original hours pending", run([{ ...row, "吉时原文": "节后卯时" }]).accepted.length === 0);
  check("Correct month hard rejection", run([row, { "坐向": "坐南", "月令": "正月", "管局 / 月规则": "煞方 不取" }]).accepted.length === 0);
  check("Another sitting prohibition not borrowed", run([row, { "坐向": "坐北", "月令": "正月", "状态": "HARD REJECT" }]).accepted.length === 1);
  check("Explicit date prohibition wins", run([{ ...row, "状态": "HARD REJECT" }]).accepted.length === 0);
  check("Wrong year counted", run([{ ...row, "公历日期": "2028-02-08" }]).counts.invalid === 1);
  check("Missing lunar month counted", run([{ ...row, "月令": "" }]).counts.invalid === 1);
  check("Unknown monthly prohibition blocks", Boolean(run([row, { "坐向": "坐南", "月令": "", "状态": "HARD REJECT" }]).error));
  check("Unsupported sitting not borrowed", Boolean(filterBedCourses([row], [], "坐西", "酉", "酉山卯向", 90, people, options).error));
  for (const degree of ["", null, undefined, NaN, -1, 361, "text"]) {
    check(`Invalid bed degree ${degree} explicit`, Boolean(filterBedCourses([row], [review],
      "坐南", "午", "午山子向", degree, people, options).error));
    check(`Invalid head degree ${degree} explicit`, Boolean(run([row], [review], 90, { headDegree: degree }).error));
  }
  check("360 equals north", courseDegreesMatch("360", 0));
  check("Blank never equals north", !courseDegreesMatch("", 0));
  const geng = [..."子丑寅卯辰巳午未申酉戌亥"].find((branch) => courseHourPillar(pillar, branch)[0] === "庚");
  const gengResult = run([{ ...row, "吉时原文": geng }]);
  check("Construction-only Geng rule not applied to bed", gengResult.accepted.length === 1
    && gengResult.accepted[0].hourRows[0].keptHours[0].hourPillar[0] === "庚");
  check("Construction sha, Tai Sui not automatically applied", run([row], [], 270).accepted.length === 1);
  const fiveAt = (palace, field) => () => ({ ...stars(), cells: stars().cells.map((cell) =>
    cell.palace === palace ? { ...cell, [field]: 5 } : cell) });
  check("Five yellow at actual bed position excludes", run([row], [review], 90, { starCalculator: fiveAt("E", "hourStar") }).accepted.length === 0);
  check("Five yellow at house sitting does not replace bed palace", run([row], [review], 90, { starCalculator: fiveAt("S", "hourStar") }).accepted[0].usable);
  check("Five yellow at bed-head direction not confused with bed position", run([row], [review], 90, { starCalculator: fiveAt("W", "hourStar") }).accepted[0].usable);
  for (const field of ["yearStar", "monthStar", "dayStar"]) {
    check(`${field} provided for review without guessed hard rule`, run([row], [review], 90, { starCalculator: fiveAt("E", field) }).accepted[0].usable);
  }
  for (const field of ["yearStar", "monthStar", "dayStar", "hourStar"]) {
    for (const value of [null, undefined, 0, 10, NaN]) {
      const missing = () => ({ ...stars(), cells: stars().cells.map((cell) => cell.palace === "E" ? { ...cell, [field]: value } : cell) });
      check(`Invalid ${field} ${value} pending`, !run([row], [review], 90, { starCalculator: missing }).accepted[0].usable);
    }
  }
  check("Missing bed palace pending", !run([row], [review], 90, {
    starCalculator: () => ({ ...stars(), cells: stars().cells.filter((cell) => cell.palace !== "E") })
  }).accepted[0].usable);
  check("Calculation errors surfaced", run([row], [review], 90, {
    starCalculator: () => ({ error: "missing terms" })
  }).accepted[0].hourRows[0].keptHours[0].warnings.includes("missing terms"));
  check("Missing solar data never certifies", !run([row], [review], 90, {
    solarFilter: () => ({ error: "missing solar table" })
  }).accepted[0].usable);
  const nextDate = "2027-02-09";
  const sorted = run([row, { ...row, "公历日期": nextDate, "日柱": dayPillarForDate(2027, 2, 9) }], [], 90, {
    solarFilter: (results) => results[0].dateKey === nextDate
      ? { accepted: [{ solarRank: 1, solarMatches: [{ label: "太陽到山" }] }] } : { accepted: [], excluded: results }
  });
  check("Solar enhancement ranks before neutral date", sorted.accepted[0].dateKey === nextDate);
  const zi = run([{ ...row, "吉时原文": "子" }]);
  check("Zi day boundary never silently certifies", !zi.accepted[0].usable
    && zi.accepted[0].hourRows[0].keptHours[0].warnings.some((text) => text.includes("日界")));
  const lichun = new Date(solarTermMoment(2027, 2).getTime() + 8 * 3600000);
  const boundaryDate = lichun.toISOString().slice(0, 10);
  const branch = "子丑寅卯辰巳午未申酉戌亥"[Math.floor((lichun.getUTCHours() + 1) / 2) % 12];
  const boundaryRow = { ...row, "公历日期": boundaryDate, "日柱": dayPillarForDate(...boundaryDate.split("-").map(Number)), "吉时原文": branch };
  const boundaryResult = run([boundaryRow], [{ ...review, "公历日期": boundaryDate }]);
  check("Solar boundary time pending", !boundaryResult.accepted[0].usable
    && boundaryResult.accepted[0].hourRows[0].keptHours[0].warnings.some((text) => text.includes("橫跨節氣")));
  check("Original annotations preserved without interpretation", good.accepted[0].rows[0]["附注 / 尾注"] === "节后传");
  check("Original mysterious hour code preserved", good.accepted[0].rows[0]["吉时编号"] === "密");
  check("Source rows not modified", row["吉时原文"] === "卯、巳" && !row["校对状态"]);
  return { passed };
}
