import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSelector } from 'react-redux';
import type { RootState } from '../../src/store';
import { openNavigationToSite } from '../../src/utils/navigation';

export default function MapScreen() {
  const sites = useSelector((s: RootState) => s.sites.items);

  const initialRegion = useMemo(() => {
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
      <View style={styles.center}><Text>Loading sites...</Text></View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
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
            }}
            // Standard props ensure Android renders the text correctly
            title={site.name}
            description={`Capacity: ${site.capacity}`}
            
            // This satisfies the navigation requirement when the bubble is tapped
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});