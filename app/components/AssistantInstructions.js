export default function AssistantInstructions() {
  return (
    <div className="mt-2 text-sm text-gray-700 bg-gray-50 border rounded p-3">
      <div className="font-semibold mb-1">How memory and training work</div>
      <ul className="list-disc ml-5 space-y-1">
        <li>
          Saying <strong>“remember this”</strong> saves a personal preference for
          you only.
        </li>
        <li>
          Personal memory is not shared and does not train the dealership AI.
        </li>
        <li>
          Managers and admins can train the AI by uploading documents, typing{" "}
          <strong>“add to brain:”</strong> before approved content, or approving
          the AI’s prompt to save results from an internet search.
        </li>
      </ul>
    </div>
  );
}
