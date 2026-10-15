import BmiAssistantChat from "../components/BmiAssistantChat";

// BMI System staff: questions about the BMI records (counts, lists,
// averages, one personnel's history) and general BMI guidance.
export default function BmiAssistant() {
  return (
    <BmiAssistantChat
      endpoint="/bmi-assistant/ask"
      tokenKey="authToken"
      title="BMI Assistant"
      subtitle="Ask about the BMI records, the PNP standards, and healthy-weight guidance."
      greeting="Hi! I can answer questions about the BMI records: counts, lists, averages, top BMIs, who hasn't been assessed, or one personnel's history. Filter by month, office, rank or sex. I can also explain the PNP BMI standards."
      suggestions={[
        "How many personnel are obese?",
        "Give me a summary for this month",
        "Who has the highest BMI?",
        "Who has not been assessed this month?",
        "List the overweight personnel",
        "Who lost the most weight?",
      ]}
    />
  );
}
