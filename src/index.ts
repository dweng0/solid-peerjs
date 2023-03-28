import { createSignal } from 'solid-js';

export const Test = () => {
  const [test, setTest] = createSignal(0);

  setTest(1);
  return test();
};
