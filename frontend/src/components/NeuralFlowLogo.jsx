import logo from "../assets/logo.png";

export default function NeuralFlowLogo({ size = 40 }) {
  return (
    <img
      src={logo}
      alt="NeuralFlow logo"
      style={{ width: size, height: size, objectFit: "contain" }}
    />
  );
}