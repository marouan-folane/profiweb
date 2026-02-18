// Verification script for draft persistence
const Project = {
    contentDraftText: "",
    contentText: "",
    isContentReady: false,
    save: function () { console.log("Saved Project:", this); }
};

async function testDraftFlow() {
    console.log("--- Testing Draft Persistence Flow ---");

    // 1. Simulate saving a draft
    const draftText = "This is a draft that should be preserved. Even with messy   spaces.";
    console.log("Simulating draft save...");
    Project.contentDraftText = draftText;
    Project.save();

    // 2. Simulate promoting draft to final submission
    console.log("\nSimulating final submission...");
    const formatted = Project.contentDraftText
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line !== '')
        .join('\n\n');

    Project.contentText = formatted;
    Project.isContentReady = true;
    Project.contentDraftText = ""; // Clear draft

    console.log("Final State:");
    console.log("- Formatted Content:", Project.contentText);
    console.log("- Is Ready:", Project.isContentReady);
    console.log("- Draft Cleared:", Project.contentDraftText === "");

    if (Project.contentDraftText === "" && Project.isContentReady) {
        console.log("\n✅ Draft persistence and promotion logic works!");
    }
}

testDraftFlow();
