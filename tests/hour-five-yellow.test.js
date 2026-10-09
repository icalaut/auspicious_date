function runHourFiveYellowTests() {
  let passed = 0;
  function check(name, value) {
    if (!value) throw new Error(name);
    passed += 1;
  }
  function date(branches, key = "2027-12-01") {
    return { dateKey: key, needsReview: true, solarRank: 3,
      hourRows: [{ row: { "吉时": branches.join("、") }, excludedHours: [],
        keptHours: branches.map((branch) => ({ branch, ownerMatches: [] })) }] };
  }
  const input = date(["卯", "巳"]);
  const before = JSON.stringify(input);
  const result = filterMoveInHourFiveYellow([input], "午");
  check("Known hour five at south rejected", result.accepted[0].hourRows[0].keptHours.map((h) => h.branch).join() === "巳");
  check("Reason retained", result.accepted[0].hourRows[0].excludedHours[0].exclusionReason.includes("時五黃"));
  check("One rejected hour", result.rejectedHourCount === 1);
  check("Original input preserved", JSON.stringify(input) === before);
  check("Review and solar rank retained", result.accepted[0].needsReview && result.accepted[0].solarRank === 3);
  check("No hours removes date", filterMoveInHourFiveYellow([date(["卯"])], "午").excluded.length === 1);
  check("Removed date explicit reason", filterMoveInHourFiveYellow([date(["卯"])], "午").excluded[0].exclusionReason.includes("時五黃"));
  check("Invalid calculation not allowed", filterMoveInHourFiveYellow([date(["卯"], "invalid")], "午").accepted.length === 0);
  check("Missing mountain not allowed", filterMoveInHourFiveYellow([input], "").accepted.length === 0);
  for (const mountain of TWENTY_FOUR_MOUNTAINS) {
    for (const key of ["2027-02-06", "2027-12-01"]) {
      const source = date([...SEXAGENARY_BRANCHES], key);
      const filtered = filterMoveInHourFiveYellow([source], mountain);
      const kept = filtered.accepted.flatMap((r) => r.hourRows.flatMap((row) => row.keptHours));
      const rejected = [...filtered.accepted, ...filtered.excluded].flatMap((r) => r.hourRows.flatMap((row) => row.excludedHours));
      check(`${mountain} ${key} all hours accounted`, kept.length + rejected.length === 12);
      check(`${mountain} ${key} only sitting hour 5 removed`, rejected.every((h) => {
        const chart = calculateEventFlyingStars(key, h.branch, mountain);
        return chart.cells.find((c) => c.palace === chart.sitting).hourStar === 5;
      }));
      check(`${mountain} ${key} no sitting five kept`, kept.every((h) => {
        const chart = calculateEventFlyingStars(key, h.branch, mountain);
        return chart.cells.find((c) => c.palace === chart.sitting).hourStar !== 5;
      }));
    }
  }
  return { passed };
}
