export const CSV_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const CSV_UPLOAD_MAX_LABEL = '5 MB';

export function getCSVRejectionMessage(fileRejections) {
  const errorCode = fileRejections?.[0]?.errors?.[0]?.code;

  if (errorCode === 'file-too-large') {
    return `CSV file must be ${CSV_UPLOAD_MAX_LABEL} or smaller`;
  }

  if (errorCode === 'file-invalid-type') {
    return 'Please upload a CSV file';
  }

  return 'Unable to use this CSV file';
}
