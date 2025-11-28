import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7B2CBF', // Purple
    secondary: '#9D4EDD',
    tertiary: '#C77DFF',
    error: '#D32F2F',
    background: '#FFFFFF',
    surface: '#F5F5F5',
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#9D4EDD',
    secondary: '#C77DFF',
    tertiary: '#E0AAFF',
  },
}


