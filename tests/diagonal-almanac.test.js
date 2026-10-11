function runDiagonalAlmanacTests({ filterAlmanacNatalCourses, isDiagonalHouseFacing,
  dayPillarForDate, BIRTH_CHART_COLUMNS, courseHourPillar, solarTermMoment }) {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  const date = "2027-02-08";
  const dayPillar = dayPillarForDate(2027, 2, 8);
  const row = BIRTH_CHART_COLUMNS.map((column) => ["相沖", "三殺", "三刑"].includes(column) ? "亥" : "");
  row[0] = "甲子";
  const people = [{ index: 0, yearPillar: "甲子", natalRow: row }];
  const day = { gregorian_date: date, day_ganzhi: dayPillar, review_status: "confirmed", book_page: "100" };
  const run = (days = [day], owners = people) => filterAlmanacNatalCourses(days, owners);
  const result = run().accepted[0];
  check("Read original day pillar", result.dayPillar === day.day_ganzhi);
  check("Exactly twelve hours audited", result.hours.length === 12);
  check("Ordered entire day", result.hours.map((hour) => hour.branch).join("") === "子丑寅卯辰巳午未申酉戌亥");
  for (const hour of result.hours) {
    check(`${hour.branch} complete hour pillar`, hour.hourPillar.length === 2
      && hour.hourPillar === courseHourPillar(dayPillar, hour.branch));
    check(`${hour.branch} all people audited`, hour.ownerMatches.length === people.length);
  }
  check("Day natal taboo checked", run([day], [{ ...people[0], natalRow: row.map((value, i) =>
    BIRTH_CHART_COLUMNS[i] === "相沖" ? dayPillar[1] : value) }]).accepted.length === 0);
  check("Hour taboo checked", !result.hours.find((hour) => hour.branch === "亥").accepted);
  check("Neutral hour kept without requiring benefit", result.hours.find((hour) => hour.branch === "卯").accepted
    && result.hours.find((hour) => hour.branch === "卯").ownerMatches[0].benefits.length === 0);
  const stemBenefit = [...row];
  const hour = result.hours.find((hour) => hour.branch === "卯");
  stemBenefit[BIRTH_CHART_COLUMNS.indexOf("進貴")] = hour.hourPillar[0];
  const benefit = run([day], [{ ...people[0], natalRow: stemBenefit }]).accepted[0].hours.find((hour) => hour.branch === "卯");
  check("Hour stem benefit actually audited", benefit.ownerMatches[0].benefits.some((text) => text.includes(`時干 ${hour.hourPillar[0]}`)));
  const two = run([day], [...people, { ...people[0], index: 1, natalRow: row.map((value, i) =>
    BIRTH_CHART_COLUMNS[i] === "三刑" ? "卯" : value) }]).accepted[0];
  check("All second-person hours audited", two.hours.every((hour) => hour.ownerMatches.length === 2));
  check("Second person hour conflict excludes", !two.hours.find((hour) => hour.branch === "卯").accepted);
  check("Second person named in reason", two.hours.find((hour) => hour.branch === "卯").exclusionReason.includes("第 2 位"));
  const allTaboo = [...row];
  for (const key of ["相沖", "三殺", "三刑"]) allTaboo[BIRTH_CHART_COLUMNS.indexOf(key)] = "子丑寅卯辰巳午未申酉戌亥";
  check("Bad date never proceeds to hour audit", run([day], [{ ...people[0], natalRow: allTaboo }]).excluded[0].hours.length === 0);
  check("Unconfirmed source remains candidate", run([{ ...day, review_status: "draft" }]).accepted[0].warnings.some((text) => text.includes("尚未校對")));
  check("Even confirmed natal pass is not complete authorization", !result.usable);
  check("Pillar mismatch blocked rather than replaced", run([{ ...day, day_ganzhi: "甲子" }]).excluded[0].dayPillar === "甲子");
  check("Missing source pillar blocked", run([{ ...day, day_ganzhi: "" }]).accepted.length === 0);
  check("Invalid sexagenary pair blocked", run([{ ...day, day_ganzhi: "甲丑" }]).accepted.length === 0);
  check("Empty sources explicit error", Boolean(run([]).error));
  check("Missing people explicit error", Boolean(run([day], []).error));
  check("Unresolved people explicit error", Boolean(run([day], [{ error: "missing" }]).error));
  check("Invalid natal blocks rather than crashes", run([day], [{ index: 0, yearPillar: "甲子", natalRow: [] }]).accepted.length === 0);
  check("Duplicate date never silently overwritten", run([day, { ...day }]).counts.duplicate === 1 && run([day, day]).accepted.length === 0);
  check("Invalid date counted", run([day, { ...day, gregorian_date: "2027-02-30" }]).counts.invalid === 1);
  check("Wrong year not used", run([day, { ...day, gregorian_date: "2028-02-08" }]).counts.sourceDays === 1);
  check("Date normalization not invented", run([{ ...day, gregorian_date: "2027/02/08" }]).error);
  for (const mountain of "丑艮寅辰巽巳未坤申戌乾亥") {
    check(`Diagonal ${mountain} gets almanac path`, isDiagonalHouseFacing(`${mountain}山測試向`));
  }
  for (const mountain of "壬子癸甲卯乙丙午丁庚酉辛") {
    check(`Cardinal ${mountain} preserves old path`, !isDiagonalHouseFacing(`${mountain}山測試向`));
  }
  for (const facing of ["", "invalid", "X山Y向"]) check(`Invalid facing ${facing}`, !isDiagonalHouseFacing(facing));
  check("Zi date ambiguity explicit", result.hours[0].warnings.some((text) => text.includes("晚子")));
  check("Zi covers both ends of calendar day", result.hours[0].range.includes("00:00") && result.hours[0].range.includes("23:59"));
  check("Last normal hour ends at 22:59", result.hours[11].range.endsWith("22:59"));
  const lichun = new Date(solarTermMoment(2027, 2).getTime() + 8 * 3600000);
  const boundaryDate = lichun.toISOString().slice(0, 10);
  const boundaryResult = run([{ ...day, gregorian_date: boundaryDate,
    day_ganzhi: dayPillarForDate(...boundaryDate.split("-").map(Number)) }]);
  if (boundaryResult.accepted.length) {
    check("Solar boundary explicitly warned", boundaryResult.accepted[0].hours.some((hour) => hour.warnings.some((text) => text.includes("橫跨節氣"))));
  } else {
    check("Solar boundary conflicting natal rejected before hours", boundaryResult.excluded[0].hours.length === 0);
  }
  check("Input original source unchanged", day.day_ganzhi === dayPillar && !day.hours);
  return { passed };
}
