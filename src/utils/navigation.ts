import { Linking, Platform } from 'react-native';

/**
 * Opens Google Maps (Android) or Apple Maps (iOS) with navigation to the specified coordinates.
 */
export async function openNavigationToSite(
  lat: number,
  lng: number,
  name?: string
): Promise<void> {
  const label = name ? encodeURIComponent(name) : '';
  let url: string;

  if (Platform.OS === 'ios') {
    url = `http://maps.apple.com/?daddr=${lat},${lng}${label ? `&q=${label}` : ''}`;
  } else {
    url = `google.navigation:q=${lat},${lng}`;
  }

  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    const fallbackUrl = `geo:${lat},${lng}?q=${lat},${lng}${label ? `(${label})` : ''}`;
    const fallbackSupported = await Linking.canOpenURL(fallbackUrl);
    if (fallbackSupported) {
      await Linking.openURL(fallbackUrl);
    }
  }
}
