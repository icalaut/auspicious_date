async function runSearchProcessingTests() {
  let passed = 0;
  function check(name, condition) {
    if (!condition) throw new Error(name);
    passed += 1;
  }
  const originalRender = renderDateSearchResults;
  try {
    let release;
    let entered;
    const started = new Promise((resolve) => { entered = resolve; });
    const pending = new Promise((resolve) => { release = resolve; });
    let calls = 0;
    renderDateSearchResults = async () => {
      calls += 1;
      entered();
      await pending;
      dateSearchResults.textContent = "Test output loaded";
    };
    const search = runDateSearch();
    check("Panel appears immediately", !dateSearchProcessingPanel.hidden);
    check("Submit disabled", dateSearchSubmitButton.disabled);
    check("Busy announced", dateSearchResults.getAttribute("aria-busy") === "true");
    await started;
    check("Panel remains during pending work", !dateSearchProcessingPanel.hidden);
    await runDateSearch();
    check("Duplicate search ignored", calls === 1);
    release();
    await search;
    check("Output loaded before panel dismissed", dateSearchResults.textContent === "Test output loaded");
    check("Panel hidden on success", dateSearchProcessingPanel.hidden);
    check("Button restored", !dateSearchSubmitButton.disabled && dateSearchSubmitButton.textContent === "擇日啟動");
    check("Busy cleared", dateSearchResults.getAttribute("aria-busy") === "false");
    renderDateSearchResults = () => { calls += 1; };
    const cancelled = runDateSearch();
    invalidateDateSearch();
    const callsAfterInvalidation = calls;
    await cancelled;
    check("Invalidated pending run does not render", calls === callsAfterInvalidation);
    check("Cancellation clears processing", !dateSearchProcessing && dateSearchProcessingPanel.hidden);
    renderDateSearchResults = () => { throw new Error("Intentional processing-test failure"); };
    await runDateSearch();
    check("Failure clears panel", dateSearchProcessingPanel.hidden && !dateSearchSubmitButton.disabled);
    check("Failure explicit to user", dateSearchStatus.textContent.includes("處理失敗"));
    check("Failure leaves no success output", !dateSearchResults.textContent && !dateSearchHasStarted);
  } finally {
    renderDateSearchResults = originalRender;
    invalidateDateSearch();
  }
  return { passed };
}
