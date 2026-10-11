function runCompassRingTests({
  COMPASS_MOUNTAIN_RINGS,
  TWENTY_FOUR_MOUNTAINS,
  compassMountainIndexForHeading,
  houseDirectionForHeading,
  normalizeCompassHeading,
  renderLuoPanDial
}) {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  check("Three ordered rings", COMPASS_MOUNTAIN_RINGS.map((ring) => ring.id).join(",") === "earth,human,heaven");
  check("Standard half-mountain offsets", COMPASS_MOUNTAIN_RINGS.map((ring) => ring.offset).join(",") === "0,-7.5,7.5");
  for (const ring of COMPASS_MOUNTAIN_RINGS) {
    for (let index = 0; index < 24; index += 1) {
      const center = index * 15 + ring.offset;
      check(`${ring.id} mountain ${index} center`, compassMountainIndexForHeading(center, ring.offset) === index);
      check(`${ring.id} mountain ${index} lower boundary`, compassMountainIndexForHeading(center - 7.5, ring.offset) === index);
      check(`${ring.id} mountain ${index} upper interior`, compassMountainIndexForHeading(center + 7.499, ring.offset) === index);
      check(`${ring.id} mountain ${index} next boundary`, compassMountainIndexForHeading(center + 7.5, ring.offset) === (index + 1) % 24);
    }
  }
  for (let degree = 0; degree < 360; degree += .5) {
    const index = Math.floor(((normalizeCompassHeading(degree) + 7.5) % 360) / 15);
    const expected = `${TWENTY_FOUR_MOUNTAINS[(index + 12) % 24]}山${TWENTY_FOUR_MOUNTAINS[index]}向`;
    check(`Earth-based house direction unchanged at ${degree}`, houseDirectionForHeading(degree) === expected);
  }
  renderLuoPanDial();
  renderLuoPanDial();
  for (const ring of COMPASS_MOUNTAIN_RINGS) {
    const layers = document.querySelectorAll(`[data-ring="${ring.id}"]`);
    check(`${ring.id} renders once`, layers.length === 1);
    const labels = [...layers[0].querySelectorAll(".compass-mountain-label")];
    check(`${ring.id} all 24 mountains in order`, labels.map((label) => label.textContent).join("") === TWENTY_FOUR_MOUNTAINS.join(""));
    check(`${ring.id} north center`, Number(labels[0].dataset.centerDegree) === normalizeCompassHeading(ring.offset));
  }
  check("Three sets of sector boundaries", document.querySelectorAll("#compass-ring-grid line").length === 72);
  check("Full degree ticks retained", document.querySelectorAll("#compass-degree-ticks span").length === 360);
  check("Eight trigrams retained", document.querySelectorAll("#compass-trigram-labels span").length === 8);
  return { passed };
}
