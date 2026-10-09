function runOwnerNatalTests({ calculateOwnerNatal, sexagenaryPillar, birthChartColumns }) {
  const passed = [];
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed.push(name);
  }
  const normal = calculateOwnerNatal("1984-07-01");
  check("Birthday alone resolves natal", normal.yearPillar === "甲子" && !normal.error);
  check("January uses the calendar birth year", calculateOwnerNatal("1984-01-01").yearPillar === "甲子");
  check("December uses the same calendar birth year", calculateOwnerNatal("1984-12-31").yearPillar === "甲子");
  check("January first changes calendar birth year", calculateOwnerNatal("1985-01-01").yearPillar === "乙丑");
  check("Lichun date needs no birth time", calculateOwnerNatal("1984-02-04").yearPillar === "甲子");
  check("Natal row matches the displayed columns", normal.natalRow.length === birthChartColumns.length);
  check("Source blank remains blank", normal.natalRow[birthChartColumns.indexOf("回頭貢殺")] === "");
  check("Invalid date is blocked", Boolean(calculateOwnerNatal("1984-02-30").error));
  check("Missing date is blocked", Boolean(calculateOwnerNatal("").error));
  check("Unsupported year is blocked", Boolean(calculateOwnerNatal("1899-01-01").error));
  check("Future birthday is blocked", Boolean(calculateOwnerNatal("2100-01-01").error));
  check("Non-leap February 29 is blocked", Boolean(calculateOwnerNatal("1985-02-29").error));
  check("Leap February 29 is valid", !calculateOwnerNatal("1984-02-29").error);
  check("Malformed date is blocked", Boolean(calculateOwnerNatal("1984-7-1").error));
  for (let year = 1900; year < 1960; year += 1) {
    const result = calculateOwnerNatal(`${year}-07-01`);
    check(`All sixty natal rows: ${year}`, result.yearPillar === sexagenaryPillar(year - 4) && !result.error);
  }
  return { passed: passed.length };
}
