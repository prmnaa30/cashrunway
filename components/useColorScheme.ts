import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useColorScheme as useColorSchemeCore } from 'react-native';

export const useColorScheme = () => {
  try {
    const nw = useNativeWindColorScheme();
    if (nw && nw.colorScheme) {
      return nw.colorScheme;
    }
  } catch (_) {}
  const coreScheme = useColorSchemeCore();
  return coreScheme === 'unspecified' ? 'light' : coreScheme;
};
