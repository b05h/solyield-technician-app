import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, LatLng } from 'react-native-maps';
import { useSelector } from 'react-redux';
import type { RootState } from '../../src/store';
import { openNavigationToSite } from '../../src/utils/navigation';

interface MapErrorEvent {
  nativeEvent: {
    error: string;
  };
}

export default function MapScreen() {
  const sites = useSelector((s: RootState) => s.sites.items);
  const [mapError, setMapError] = useState<string | null>(null);

  const initialRegion = useMemo<Region | null>(() => {
    if (sites.length === 0) return null;
    return {
      latitude: sites[0].location.lat,
      longitude: sites[0].location.lng,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  }, [sites]);

  if (!initialRegion) {
    return (
      <View style={styles.center}>
        <Text>Loading sites...</Text>
      </View>
    );
  }

  if (mapError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Map unavailable</Text>
        <Text style={styles.errorMessage}>
          {mapError || 'Google Play Services may be missing or outdated on this device.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        
      >
        {sites.map((site) => (
          <Marker
            key={site.id}
            pinColor="#F97316"
            coordinate={{
              latitude: site.location.lat,
              longitude: site.location.lng,
            } as LatLng}
            title={site.name}
            description={`Capacity: ${site.capacity}`}
            onCalloutPress={() =>
              openNavigationToSite(site.location.lat, site.location.lng, site.name)
            }
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});