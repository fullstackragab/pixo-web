'use client';

import { useState, useEffect, useRef } from 'react';
import Input from './Input';
import { Location } from '@/types';

// Common countries for suggestions (not enforced)
const COMMON_COUNTRIES = [
  'United States',
  'United Kingdom',
  'Germany',
  'France',
  'Netherlands',
  'Canada',
  'Australia',
  'Spain',
  'Italy',
  'Poland',
  'Sweden',
  'Switzerland',
  'Portugal',
  'Ireland',
  'Austria',
  'Belgium',
  'Denmark',
  'Norway',
  'Finland',
  'Czech Republic',
  'India',
  'Brazil',
  'Mexico',
  'Singapore',
  'Japan',
  'South Korea',
  'Israel',
  'United Arab Emirates',
];

// Common timezones
const TIMEZONES = [
  { value: 'UTC-12:00', label: 'UTC-12:00 (Baker Island)' },
  { value: 'UTC-11:00', label: 'UTC-11:00 (American Samoa)' },
  { value: 'UTC-10:00', label: 'UTC-10:00 (Hawaii)' },
  { value: 'UTC-09:00', label: 'UTC-09:00 (Alaska)' },
  { value: 'UTC-08:00', label: 'UTC-08:00 (Pacific Time)' },
  { value: 'UTC-07:00', label: 'UTC-07:00 (Mountain Time)' },
  { value: 'UTC-06:00', label: 'UTC-06:00 (Central Time)' },
  { value: 'UTC-05:00', label: 'UTC-05:00 (Eastern Time)' },
  { value: 'UTC-04:00', label: 'UTC-04:00 (Atlantic Time)' },
  { value: 'UTC-03:00', label: 'UTC-03:00 (Buenos Aires)' },
  { value: 'UTC-02:00', label: 'UTC-02:00 (Mid-Atlantic)' },
  { value: 'UTC-01:00', label: 'UTC-01:00 (Azores)' },
  { value: 'UTC+00:00', label: 'UTC+00:00 (London, Dublin)' },
  { value: 'UTC+01:00', label: 'UTC+01:00 (Berlin, Paris, CET)' },
  { value: 'UTC+02:00', label: 'UTC+02:00 (Helsinki, Athens, EET)' },
  { value: 'UTC+03:00', label: 'UTC+03:00 (Moscow, Istanbul)' },
  { value: 'UTC+04:00', label: 'UTC+04:00 (Dubai)' },
  { value: 'UTC+05:00', label: 'UTC+05:00 (Karachi)' },
  { value: 'UTC+05:30', label: 'UTC+05:30 (Mumbai, Delhi)' },
  { value: 'UTC+06:00', label: 'UTC+06:00 (Dhaka)' },
  { value: 'UTC+07:00', label: 'UTC+07:00 (Bangkok, Jakarta)' },
  { value: 'UTC+08:00', label: 'UTC+08:00 (Singapore, Hong Kong)' },
  { value: 'UTC+09:00', label: 'UTC+09:00 (Tokyo, Seoul)' },
  { value: 'UTC+10:00', label: 'UTC+10:00 (Sydney)' },
  { value: 'UTC+11:00', label: 'UTC+11:00 (Solomon Islands)' },
  { value: 'UTC+12:00', label: 'UTC+12:00 (Auckland)' },
];

interface LocationInputProps {
  value: Location;
  onChange: (location: Location) => void;
  showRelocation?: boolean;
  label?: string;
  compact?: boolean;
}

export default function LocationInput({
  value,
  onChange,
  showRelocation = false,
  label = 'Current Location',
  compact = false,
}: LocationInputProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [countryInput, setCountryInput] = useState(value.country || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);
  const countryInputRef = useRef<HTMLDivElement>(null);

  // Sync countryInput with value.country when it changes externally
  useEffect(() => {
    setCountryInput(value.country || '');
  }, [value.country]);

  // Filter countries based on input
  useEffect(() => {
    if (countryInput.trim()) {
      const filtered = COMMON_COUNTRIES.filter(country =>
        country.toLowerCase().includes(countryInput.toLowerCase())
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(COMMON_COUNTRIES);
    }
  }, [countryInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryInputRef.current && !countryInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryInputChange = (inputValue: string) => {
    setCountryInput(inputValue);
    setShowSuggestions(true);
    // Save the raw value as-is
    onChange({
      ...value,
      country: inputValue || undefined,
    });
  };

  const handleCountrySuggestionClick = (country: string) => {
    setCountryInput(country);
    setShowSuggestions(false);
    onChange({
      ...value,
      country: country,
    });
  };

  const handleChange = (field: keyof Location, fieldValue: string | boolean) => {
    onChange({
      ...value,
      [field]: fieldValue,
    });
  };

  // Auto-detect timezone on mount if not set
  useEffect(() => {
    if (!value.timezone) {
      try {
        const offset = new Date().getTimezoneOffset();
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        const sign = offset <= 0 ? '+' : '-';
        const timezoneGuess = `UTC${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Only set if it matches one of our options
        const matchingTimezone = TIMEZONES.find(tz => tz.value === timezoneGuess);
        if (matchingTimezone) {
          handleChange('timezone', matchingTimezone.value);
        }
      } catch {
        // Ignore timezone detection errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div ref={countryInputRef} className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              value={countryInput}
              onChange={(e) => handleCountryInputChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Type your country (optional)"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">If you don&apos;t see it, just type it.</p>
            {showSuggestions && filteredCountries.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <li
                    key={country}
                    onClick={() => handleCountrySuggestionClick(country)}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                  >
                    {country}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Input
            label="City"
            value={value.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="e.g. Berlin"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {label && (
        <h3 className="text-sm font-medium text-gray-700">{label}</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={countryInputRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            value={countryInput}
            onChange={(e) => handleCountryInputChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Type your country (optional)"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">If you don&apos;t see it, just type it.</p>
          {showSuggestions && filteredCountries.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredCountries.map((country) => (
                <li
                  key={country}
                  onClick={() => handleCountrySuggestionClick(country)}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                >
                  {country}
                </li>
              ))}
            </ul>
          )}
        </div>

        <Input
          label="City"
          value={value.city || ''}
          onChange={(e) => handleChange('city', e.target.value)}
          placeholder="e.g. Berlin, Munich"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        {showAdvanced ? '− Hide timezone' : '+ Set timezone'}
      </button>

      {showAdvanced && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={value.timezone || ''}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select timezone...</option>
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showRelocation && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.willingToRelocate || false}
            onChange={(e) => handleChange('willingToRelocate', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Open to relocation</span>
        </label>
      )}
    </div>
  );
}
