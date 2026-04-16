"use client";

import { useState } from "react";
import {
  formatBrazilPhone,
  PHONE_ERROR_MESSAGE,
  PHONE_PATTERN,
  PHONE_PLACEHOLDER,
} from "@/lib/phone";

type PhoneInputProps = {
  name: string;
  defaultValue?: string;
  required?: boolean;
  style?: React.CSSProperties;
};

export function PhoneInput({
  name,
  defaultValue = "",
  required = false,
  style,
}: PhoneInputProps) {
  const [value, setValue] = useState(formatBrazilPhone(defaultValue));

  return (
    <input
      name={name}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      placeholder={PHONE_PLACEHOLDER}
      pattern={PHONE_PATTERN}
      title={PHONE_ERROR_MESSAGE}
      required={required}
      value={value}
      onChange={(event) => {
        event.currentTarget.setCustomValidity("");
        setValue(formatBrazilPhone(event.currentTarget.value));
      }}
      onInvalid={(event) => {
        event.currentTarget.setCustomValidity(PHONE_ERROR_MESSAGE);
      }}
      style={style}
    />
  );
}
