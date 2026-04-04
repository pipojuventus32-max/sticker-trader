export async function shareText(title: string, text: string) {
  const nav = navigator as unknown as { share?: (data: any) => Promise<void> };

  if (typeof nav.share === 'function') {
    await nav.share({ title, text });
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard.');
    return;
  }

  // Last resort fallback
  window.prompt('Copy this text:', text);
}

