// components/CustomText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';

const CustomText: React.FC<TextProps> = ({ style, children, ...rest }) => {
  return (
    <Text
      {...rest}
      style={style}
      allowFontScaling={false} // Disable font scaling
    >
      {children}
    </Text>
  );
};

export default CustomText;
