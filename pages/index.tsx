import { useEffect } from "react";

export default function Index(): JSX.Element {
  useEffect(() => {
    window.location.href = "https://juliocaesar.co";
  }, []);
  return (
    <div>
      <span />
    </div>
  );
}
