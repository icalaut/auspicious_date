function runEventFlyingStarTests({ calculateEventFlyingStars, renderEventFlyingStars }) {
  let passed = 0;
  function check(name, value) {
    if (!value) throw new Error(name);
    passed += 1;
  }
  check("Invalid date", Boolean(calculateEventFlyingStars("2027-02-30", "卯", "午").error));
  check("Invalid hour", Boolean(calculateEventFlyingStars("2027-12-01", "甲", "午").error));
  check("Invalid mountain", Boolean(calculateEventFlyingStars("2027-12-01", "卯", "").error));
  const winter = calculateEventFlyingStars("2027-02-06", "卯", "午");
  check("UTC8 midpoint", winter.hour === 6);
  check("Winter forward", winter.forward);
  check("South sitting", winter.sitting === "S");
  for (const branch of "子丑寅卯辰巳午未申酉戌亥") {
    const chart = calculateEventFlyingStars("2027-12-01", branch, "午");
    check(`${branch} nine palaces`, chart.cells.length === 9);
    check(`${branch} daily permutation`, new Set(chart.cells.map((cell) => cell.dayStar)).size === 9);
    check(`${branch} hourly permutation`, new Set(chart.cells.map((cell) => cell.hourStar)).size === 9);
    check(`${branch} stars in range`, chart.cells.every((cell) =>
      cell.dayStar >= 1 && cell.dayStar <= 9 && cell.hourStar >= 1 && cell.hourStar <= 9));
  }
  const autumn = calculateEventFlyingStars("2027-12-01", "卯", "午");
  check("Winter before solstice reverse", !autumn.forward);
  // 2027-12-01 甲寅: 霜降 offset 61, day cycle 51 -> 日星一入中;
  // 寅日逆飛子時三入中，卯時九入中。
  check("Independent day center", autumn.cells.find((c) => c.palace === "CENTER").dayStar === 1);
  check("Independent hour center", autumn.cells.find((c) => c.palace === "CENTER").hourStar === 9);
  const rendered = renderEventFlyingStars("2027-12-01", "卯", "午");
  check("Nine rendered cells", rendered.querySelectorAll(".event-stars-cell").length === 9);
  check("Exactly one sitting highlight", rendered.querySelectorAll(".sitting").length === 1);
  check("Chart visible by default", rendered.open);
  check("Zi ambiguity surfaced", renderEventFlyingStars("2027-12-01", "子", "午").textContent.includes("日界待核"));
  check("Error rendered explicitly", renderEventFlyingStars("invalid", "卯", "午").textContent.includes("無效"));
  check("Month stars are permutation", new Set(autumn.cells.map((c) => c.monthStar)).size === 9);
  check("亥月 in 未年 gives 五入中", autumn.cells.find((c) => c.palace === "CENTER").monthStar === 5);
  check("2027 uses correct solar year", autumn.solarYear === 2027);
  check("Early January uses previous solar year", calculateEventFlyingStars("2027-01-01", "卯", "午").solarYear === 2026);
  check("Six layers in each rendered palace", [...rendered.querySelectorAll(".event-stars-layer")].every((layer) => layer.children.length === 6));
  check("Facing highlight shown", rendered.querySelectorAll(".facing").length === 1);
  const oldPeriod = moveInHousePeriodSelect.value;
  const oldDirection = houseFacingSelect.value;
  try {
    moveInHousePeriodSelect.value = "";
    houseFacingSelect.value = "午山子向";
    check("Missing period explicit", renderEventFlyingStars("2027-12-01", "卯", "午").textContent.includes("請先選擇宅運及住宅坐向。"));
    moveInHousePeriodSelect.value = "九運";
    const house = calculateHouseFlyingStars("九運", "午山子向");
    check("House layers available", !house.error);
    for (const palace of ["CENTER", "N", "S", "E", "W", "NE", "SE", "NW", "SW"]) {
      check(`${palace} house layer range`, [house.mountainStars[palace], house.facingStars[palace]]
        .every((star) => Number.isInteger(star) && star >= 1 && star <= 9));
    }
    const full = renderEventFlyingStars("2027-12-01", "卯", "午");
    const grid = full.querySelector(".event-stars-grid");
    for (let i = 0; i < autumn.cells.length; i += 1) {
      const palace = autumn.cells[i].palace;
      const values = grid.children[i].querySelector(".event-stars-layer").children;
      check(`${palace} mountain matches house`, values[4].textContent.startsWith(`山 ${house.mountainStars[palace]} ·`));
      check(`${palace} facing matches house`, values[5].textContent.startsWith(`向 ${house.facingStars[palace]} ·`));
    }
    const expectedYear = { N: 5, NE: 3, E: 7, SE: 8, S: 4, SW: 6, W: 2, NW: 1 };
    for (const cell of autumn.cells.filter((cell) => cell.palace !== "CENTER")) {
      check(`${cell.palace} annual source`, cell.yearStar === expectedYear[cell.palace]);
    }
    check("Missing annual chart never substituted", Boolean(
      calculateEventFlyingStars("1900-12-01", "卯", "午").annualWarning));
  } finally {
    moveInHousePeriodSelect.value = oldPeriod;
    houseFacingSelect.value = oldDirection;
  }
  return { passed };
}
