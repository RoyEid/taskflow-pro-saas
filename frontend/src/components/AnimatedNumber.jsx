
import useCountUp from '../hooks/useCountUp';

export default function AnimatedNumber({ value, duration = 800 }) {
  const animatedValue = useCountUp(value, duration);
  
  return <span>{animatedValue}</span>;
}
