const CSV_HEADERS = ['email', 'role', 'location'];
const SAMPLE_DATA = [
  ['john.doe@example.com', 'EMPLOYEE', 'Main Office'],
  ['jane.smith@example.com', 'MANAGER', 'Branch 1'],
];

export function generateCSVTemplate(): string {
  const headers = CSV_HEADERS.join(',');
  const rows = SAMPLE_DATA.map(row => row.join(','));
  return [headers, ...rows].join('\n');
}

export function downloadCSVTemplate() {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'invitation-template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
