function runDongTuTests({ filterDongTuCourses, dongTuShaAtDegree, dongTuHourPillar,
  dongTuSolarBoundaryWarning, solarTermMoment, dayPillarForDate,
  BIRTH_CHART_COLUMNS, sexagenaryPillar, calculateEventFlyingStars }) {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  const date = "2027-02-08";
  const pillar = dayPillarForDate(2027, 2, 8);
  const natalRow = BIRTH_CHART_COLUMNS.map((column) =>
    column === "本命" ? "甲子" : ["相沖", "三殺", "三刑"].includes(column) ? "亥" : "");
  natalRow[0] = "甲子";
  const owners = [{ index: 0, yearPillar: "甲子", natalRow }];
  const course = { "坐向": "坐北", "月令": "正月", "公历日期": date,
    "日柱": pillar, "吉时": "卯、巳", "管局 / 月规则": "壬寅管局" };
  const review = { "公历日期": date, "住宅坐向": "子山午向", "施工角度": "90",
    "屋前角度": "180", "屋後角度": "0", "屋主年柱": "甲子", "校对状态": "confirmed", "来源": "教材测试页",
    "土王用事": "可动土", "年神方位": "已核对无禁忌", "日课组合": "已核对无禁忌" };
  const starCalculator = () => ({
    solarYear: 2027, yearPillar: "丁未", monthPillar: "壬寅", sitting: "E",
    cells: ["E", "N"].map((palace) => ({ palace, label: palace,
      yearStar: 1, monthStar: 2, dayStar: 3, hourStar: 4 }))
  });
  const options = { starCalculator, solarFilter: () => ({ accepted: [], excluded: [] }), frontDegree: 180, rearDegree: 0 };
  const run = (rows = [course], reviews = [review], degree = 90, extra = {}) =>
    filterDongTuCourses(rows, reviews, "坐北", "子", "子山午向", degree, owners, { ...options, ...extra });
  const good = run();
  check("Neutral natal date and hours accepted", good.accepted.length === 1 && good.accepted[0].usable);
  check("Benefits not required for earthwork hours", good.accepted[0].hourRows[0].keptHours.every((hour) =>
    hour.ownerMatches[0].benefits.length === 0));
  check("No solar match does not exclude", good.accepted[0].solarRank === 5 && good.accepted[0].usable);
  const nextDate = "2027-02-09";
  const nextCourse = { ...course, "公历日期": nextDate, "日柱": dayPillarForDate(2027, 2, 9) };
  const ranked = run([course, nextCourse], [review, { ...review, "公历日期": nextDate }], 90, {
    solarFilter: (results) => results[0].dateKey === nextDate
      ? { accepted: [{ ...results[0], solarRank: 1, solarMatches: [{ label: "太陽到山" }] }] }
      : { accepted: [], excluded: results }
  });
  check("Solar improvement ranks before a neutral date", ranked.accepted.length === 2 && ranked.accepted[0].dateKey === nextDate);
  const tabooRow = [...natalRow];
  for (const label of ["相沖", "三殺", "三刑"]) tabooRow[BIRTH_CHART_COLUMNS.indexOf(label)] = pillar[1];
  check("Any second owner taboo cannot be ignored", filterDongTuCourses([course], [], "坐北", "子", "子山午向", 90,
    [...owners, { ...owners[0], index: 1, natalRow: tabooRow }], options).accepted.length === 0);
  check("Unreviewed original workbook is pending", !run([course], []).accepted[0].usable);
  for (const field of ["校对状态", "来源", "住宅坐向", "屋前角度", "屋後角度", "施工角度", "屋主年柱", "土王用事", "年神方位", "日课组合"]) {
    check(`Missing ${field} cannot certify`, !run([course], [{ ...review, [field]: "" }]).accepted[0].usable);
  }
  for (const field of ["土王用事", "年神方位", "日课组合"]) {
    check(`${field} rejection overrides solar`, run([course], [{ ...review, [field]: "禁动土" }]).accepted.length === 0);
  }
  check("Duplicate reviews never certify", !run([course], [review, review]).accepted[0].usable);
  check("Review bound to exact starting angle", !run([course], [review], 91).accepted[0].usable);
  check("Review not reused at another compatible facing degree", !run([course], [review], 90, { frontDegree: 181 }).accepted[0].usable);
  check("Review not reused at another compatible sitting degree", !run([course], [review], 90, { rearDegree: 1 }).accepted[0].usable);
  check("Out of range review angle rejected", !run([course], [{ ...review, "施工角度": "450" }]).accepted[0].usable);
  check("Pillar mismatch blocks date", run([{ ...course, "日柱": "" }]).excluded[0].exclusionReason.includes("日柱"));
  check("Conflicting duplicate source blocks whole date", run([course, { ...course, "日柱": "甲子" }]).accepted.length === 0);
  check("Original missing hours never filled", run([{ ...course, "吉时": "" }]).accepted.length === 0);
  check("Conditional original hours never inferred", run([{ ...course, "吉时": "忌午时" }]).accepted.length === 0);
  check("Monthly prohibition takes precedence", run([course, { "坐向": "坐北", "月令": "正月", "管局 / 月规则": "煞方 不取" }]).accepted.length === 0);
  check("Other sitting prohibition not borrowed", run([course, { "坐向": "坐南", "月令": "正月", "管局 / 月规则": "煞方 不取" }]).accepted.length === 1);
  for (const value of ["", null, -1, 361, NaN, "garbage"]) check(`Invalid start ${value} explicit`, Boolean(run([course], [review], value).error));
  for (const branch of "申子辰") {
    for (const degree of [135, 150, 180, 210, 225]) check(`${branch} south wide sha ${degree}`, dongTuShaAtDegree(branch, degree));
    check(`${branch} outside south sha`, !dongTuShaAtDegree(branch, 134.9));
  }
  for (const degree of [315, 359, 0, 45]) check(`North sha wrap ${degree}`, dongTuShaAtDegree("午", degree));
  check("Unknown sha branch explicit", dongTuShaAtDegree("", 90) === null);
  for (const [degree, word] of [[270, "年三煞"], [315, "年三煞"], [210, "太歲"], [30, "歲破"], [0, "月三煞"]]) {
    check(`Location ${degree} rejected for ${word}`, run([course], [], degree).excluded[0].hourRows[0].excludedHours
      .some((hour) => hour.exclusionReason.includes(word)));
  }
  for (const [field, label] of [["yearStar", "年"], ["monthStar", "月"], ["hourStar", "時"]]) {
    const badStars = () => ({ ...starCalculator(),
      cells: starCalculator().cells.map((cell) => cell.palace === "E" ? { ...cell, [field]: 5 } : cell) });
    check(`${label} five-yellow at worksite blocked`, run([course], [review], 90, { starCalculator: badStars }).accepted.length === 0);
  }
  const sittingFive = () => ({ ...starCalculator(),
    cells: starCalculator().cells.map((cell) => cell.palace === "N" ? { ...cell, hourStar: 5 } : cell) });
  check("Sitting hour five-yellow also blocked", run([course], [review], 90, { starCalculator: sittingFive }).accepted.length === 0);
  const missingYear = () => ({ ...starCalculator(), cells: starCalculator().cells.map((cell) => ({ ...cell, yearStar: null })) });
  check("Missing confirmed annual star cannot certify", !run([course], [review], 90, { starCalculator: missingYear }).accepted[0].usable);
  check("Calculation errors stay explicit", run([course], [review], 90, {
    starCalculator: () => ({ error: "Missing terms" })
  }).accepted[0].hourRows[0].keptHours[0].warnings.includes("Missing terms"));
  check("Solar data missing remains pending", !run([course], [review], 90, {
    solarFilter: () => ({ error: "Missing solar table" })
  }).accepted[0].usable);
  for (let day = 0; day < 60; day += 1) {
    for (const branch of "子丑寅卯辰巳午未申酉戌亥") {
      const hourPillar = dongTuHourPillar(sexagenaryPillar(day), branch);
      check(`Valid hour pillar ${day} ${branch}`, Array.from({ length: 60 }, (_, i) => sexagenaryPillar(i)).includes(hourPillar));
    }
  }
  check("甲日子時甲子", dongTuHourPillar("甲子", "子") === "甲子");
  check("乙日子時丙子", dongTuHourPillar("乙丑", "子") === "丙子");
  check("戊日子時壬子", dongTuHourPillar("戊辰", "子") === "壬子");
  check("Invalid hour pillar not invented", dongTuHourPillar("甲丑", "子") === "");
  const gengBranch = [..."子丑寅卯辰巳午未申酉戌亥"].find((branch) => dongTuHourPillar(pillar, branch)[0] === "庚");
  check("Geng construction hour rejected", run([{ ...course, "吉时": gengBranch }]).accepted.length === 0);
  const zi = run([{ ...course, "吉时": "子、卯" }]);
  check("Zi time cannot silently certify", zi.accepted[0].hourRows[0].keptHours.find((hour) => hour.branch === "子").warnings.some((text) => text.includes("日界")));
  check("January uses previous solar year", calculateEventFlyingStars("2027-01-01", "卯", "子").yearPillar === "丙午");
  check("February uses new solar year", calculateEventFlyingStars(date, "卯", "子").yearPillar === "丁未");
  check("Solar month pillar independently correct", calculateEventFlyingStars(date, "卯", "子").monthPillar === "壬寅");
  check("December month pillar independently correct", calculateEventFlyingStars("2027-12-01", "卯", "子").monthPillar === "辛亥");
  const lichun = new Date(solarTermMoment(2027, 2).getTime() + 8 * 3600000);
  const boundaryDate = lichun.toISOString().slice(0, 10);
  const boundaryHour = "子丑寅卯辰巳午未申酉戌亥"[Math.floor((lichun.getUTCHours() + 1) / 2) % 12];
  check("A time spanning Lichun cannot silently certify", dongTuSolarBoundaryWarning(boundaryDate, boundaryHour).includes("橫跨節氣"));
  check("Ordinary time has no solar-boundary warning", dongTuSolarBoundaryWarning(date, "卯") === "");
  check("Original source rows preserved", course["吉时"] === "卯、巳" && course["日柱"] === pillar);
  return { passed };
}
