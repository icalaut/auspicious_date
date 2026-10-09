function runSolarDateFilterTests({ filterMoveInSolarDates, periods }) {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  const date = (monthDay) => ({ dateKey: `2027-${monthDay}`, needsReview: true, hourRows: [{ keptHours: [{ branch: "卯" }] }] });
  for (const entry of periods) {
    for (const [index, key] of ["solarToMountain", "solarToFacing", "triadFirst", "triadSecond"].entries()) {
      const p = entry[key];
      for (const day of [p.startMonthDay, p.endMonthDay]) {
        const found = filterMoveInSolarDates([date(day)], entry.mountain);
        check(`${entry.mountain} ${key} ${day} inclusive`, found.accepted.length === 1
          && found.accepted[0].solarMatches.some((m) => m.rank === index + 1));
      }
    }
  }
  const original = [date("03-22"), date("11-25"), date("01-23"), date("07-25"), date("05-01")];
  const before = JSON.stringify(original);
  const sorted = filterMoveInSolarDates(original, "午");
  check("Strict rank order", sorted.accepted.map((r) => r.solarRank).join() === "1,2,3,4");
  check("No match excluded", sorted.excluded.length === 1 && sorted.excluded[0].dateKey === "2027-05-01");
  check("Source never modified", before === JSON.stringify(original));
  check("Accepted hours retained", sorted.accepted.every((r) => r.hourRows[0].keptHours[0].branch === "卯"));
  check("Review status retained", sorted.accepted.every((r) => r.needsReview));
  check("Year crossing December", filterMoveInSolarDates([date("12-31")], "未").accepted[0].solarRank === 2);
  check("Year crossing January", filterMoveInSolarDates([date("01-01")], "未").accepted[0].solarRank === 2);
  check("Outside wrapped range", filterMoveInSolarDates([date("01-06")], "未").accepted.length === 0);
  check("Missing exact mountain blocked", Boolean(filterMoveInSolarDates(original, "子").error));
  check("No facing substitution", Boolean(filterMoveInSolarDates(original, "壬").error));
  check("Invalid date excluded", filterMoveInSolarDates([{ dateKey: "2027-02-30" }], "午").accepted.length === 0);
  const broken = [{ ...periods[0], solarToMountain: { mountain: "丙", startMonthDay: "02-30", endMonthDay: "03-01" } }];
  check("Invalid source period blocked", Boolean(filterMoveInSolarDates(original, "丙", broken).error));
  const overlap = [{ ...periods[0], solarToFacing: periods[0].solarToMountain }];
  const overlapping = filterMoveInSolarDates([date("08-10")], "丙", overlap);
  check("All overlapping hits retained", overlapping.accepted[0].solarMatches.length === 2);
  check("Best overlapping rank chosen", overlapping.accepted[0].solarRank === 1);
  check("Chronological ties", filterMoveInSolarDates([date("08-12"), date("08-10")], "丙").accepted[0].dateKey === "2027-08-10");
  check("Empty input stays empty", filterMoveInSolarDates([], "午").accepted.length === 0);
  return { passed };
}
