import { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import useCountdown from "../../hooks/useCountdown";

const FlipCard = ({ value, label, theme }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [previousValue, setPreviousValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  // Sync value prop with internal state to trigger animation
  useEffect(() => {
    if (value !== currentValue) {
      setPreviousValue(currentValue);
      setCurrentValue(value);
      setIsFlipping(true);

      const timer = setTimeout(() => {
        setIsFlipping(false);
        setPreviousValue(value); // Reset after flip completes
      }, 600); // 600ms = animation duration

      return () => clearTimeout(timer);
    }
  }, [value, currentValue]);

  // Ensure 2 digits
  const current = String(currentValue).padStart(2, "0");
  const previous = String(previousValue).padStart(2, "0");

  const cardStyle = `
    relative w-14 h-18 md:w-16 md:h-20 rounded-lg
    flex flex-col
    text-2xl md:text-4xl font-bold
    bg-transparent
    perspective-1000
    transform-style-3d
    ${theme === "light" ? "text-gray-800" : "text-white"}
  `;

  // Shared styles for halves
  const halfStyle = `
    absolute left-0 w-full h-[50%] overflow-hidden flex justify-center
    ${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"}
    border-x border-t
  `;
  
  const bottomHalfStyle = `
    absolute left-0 top-[50%] w-full h-[50%] overflow-hidden flex justify-center items-end
    ${theme === "light" ? "bg-white border-gray-200" : "bg-gray-800 border-gray-700"}
    border-x border-b
  `;

  return (
    <div className="flex flex-col items-center">
      <div className={`${cardStyle} perspective`}>
          {/* 
             Structure for Flip:
             - Top Half (Static - Next Value): Shows 'current' (the new value)
             - Top Half (Flipping - Old Value): Shows 'previous', rotates down 
             - Bottom Half (Static - Old Value): Shows 'previous'
             - Bottom Half (Flipping - Next Value): Shows 'current', rotates down
          */}

          {/* BACKGROUND: Top Half of New Value (Will be revealed) */}
          <div className={`${halfStyle} rounded-t-lg items-end z-0`}>
             <span className="translate-y-[50%]">{current}</span>
             <div className="absolute bottom-0 w-full h-[1px] bg-black/10"></div>
          </div>

           {/* BACKGROUND: Bottom Half of Old Value (Will be covered) */}
           <div className={`${bottomHalfStyle} rounded-b-lg items-start z-0`}>
             <span className="-translate-y-[50%]">{previous}</span>
              <div className="absolute top-0 w-full h-[1px] bg-black/10"></div>
          </div>

          {/* ANIMATING: Top Half of Old Value (Flips Down) */}
          <div 
            key={`top-${currentValue}-${previousValue}`} 
            className={`
                ${halfStyle} rounded-t-lg items-end z-10 origin-bottom backface-hidden
                ${isFlipping ? "animate-flip-top" : ""}
            `}
          >
              <span className="translate-y-[50%]">{previous}</span>
              <div className="absolute bottom-0 w-full h-[1px] bg-black/10"></div>
          </div>

          {/* ANIMATING: Bottom Half of New Value (Flips Down to cover) */}
          <div 
             key={`bottom-${currentValue}-${previousValue}`}
             className={`
                ${bottomHalfStyle} rounded-b-lg items-start z-10 origin-top backface-hidden rotation-x-180
                ${isFlipping ? "animate-flip-bottom" : ""}
             `}
             style={{ transform: isFlipping ? "" : "rotateX(180deg)" }}
          >
              <span className="-translate-y-[50%]">{current}</span>
              <div className="absolute top-0 w-full h-[1px] bg-black/10"></div>
          </div>
      </div>

      <span className="mt-1 text-[9px] md:text-[10px] font-medium uppercase tracking-wider opacity-70">
        {label}
      </span>
    </div>
  );
};

const CountdownTimer = () => {
  const { theme } = useTheme();
  const { days, hours, minutes, seconds, isExpired } = useCountdown();

  if (isExpired) return null;

  return (
    <div className="w-full flex flex-col items-center">
      <style>{`
        .perspective {
            perspective: 400px;
        }
        .transform-style-3d {
            transform-style: preserve-3d;
        }
        .backface-hidden {
            backface-visibility: hidden;
        }
        .rotation-x-180 {
            transform: rotateX(180deg);
        }

        @keyframes flipTop {
          0% { transform: rotateX(0deg); }
          100% { transform: rotateX(-180deg); }
        }

        @keyframes flipBottom {
          0% { transform: rotateX(180deg); }
          100% { transform: rotateX(0deg); }
        }

        .animate-flip-top {
          animation: flipTop 0.6s ease-in forwards;
        }
        
        .animate-flip-bottom {
          animation: flipBottom 0.6s ease-out forwards;
        }
      `}</style>
      


      <div className="flex gap-2 md:gap-3">
        <FlipCard value={days} label="Days" theme={theme} />
        <FlipCard value={hours} label="Hours" theme={theme} />
        <FlipCard value={minutes} label="Min" theme={theme} />
        <FlipCard value={seconds} label="Sec" theme={theme} />
      </div>
    </div>
  );
};

export default CountdownTimer;
