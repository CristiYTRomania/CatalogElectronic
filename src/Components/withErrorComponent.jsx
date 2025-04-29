import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./ErrorFallback";

const withErrorBoundary = (Component) => (props) =>
  (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

export default withErrorBoundary;
