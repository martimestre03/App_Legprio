import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

const CustomTextInput: React.FC<TextInputProps> = ({ style, ...rest }) => {
  return (
    <TextInput
      {...rest}
      style={style}
      allowFontScaling={false} // Disable font scaling
    />
  );
};

export default CustomTextInput;
