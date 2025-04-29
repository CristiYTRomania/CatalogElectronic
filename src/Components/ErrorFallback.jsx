import React from "react";

export function ErrorFallback({ error, resetErrorBoundary }) {
  console.log({ error });
  return (
    <div
      role="alert"
      style={{ padding: 20, backgroundColor: "#fee", color: "#900" }}
    >
      <h2>Oops! A apărut o eroare:</h2>
      <pre>{error.message}</pre>
      <>Contacteaza suportul</>
    </div>
  );
}
