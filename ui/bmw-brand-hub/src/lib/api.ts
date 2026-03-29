const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

export async function analyzeApplicants(params: {
  scenarioName: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("scenario_name", params.scenarioName);
  formData.append("applicants_file", params.file);

  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.detail || "Analysis failed.");
  }

  return data;
}