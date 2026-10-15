import BmiAssistantChat from "../components/BmiAssistantChat";

// Personnel self-service: answers use the signed-in personnel's own records.
export default function MyAssistant() {
  return (
    <BmiAssistantChat
      endpoint="/bmi-assistant/me/ask"
      tokenKey="personnelAuthToken"
      title="BMI Assistant"
      subtitle="Ask about your BMI, your PNP classification, and how to reach a healthy weight."
      greeting="Hi! I can explain your latest BMI result and give tips on food and exercise. You can ask in English or Filipino."
      suggestions={[
        "What is my BMI result?",
        "How much weight should I lose?",
        "What is the PNP BMI classification?",
        "Is it okay for me to eat rice every meal?",
        "Anong ehersisyo ang maganda para sa akin?",
      ]}
    />
  );
}
