import bmwLogo from "@/assets/bmw-logo.png";

const BmwLogoBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <img
          src={bmwLogo}
          alt=""
          className="w-[600px] h-[600px] object-contain animate-spin-slow animate-pulse-glow opacity-[0.04] dark:opacity-[0.06] select-none"
          draggable={false}
        />
      </div>
    </div>
  );
};

export default BmwLogoBackground;
