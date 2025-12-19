import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const SoftwareInfo = () => {
  return (
   <View
            style={{
              width: '50%',
              backgroundColor: '#F8FAFC',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 32,
            }}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: '700',
                color: '#0F172A',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              Welcome to DevERP 
            </Text>

            {/* Subtitle */}
            <Text
              style={{
                fontSize: 15,
                color: '#475569',
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 22,
              }}
            >
              Manage your business smarter and faster with one unified platform.
            </Text>

            {/* Feature list */}
            <View style={{ width: '100%', gap: 8 }}>
              {[
                '📊 Real-time business insights',
                '🔐 Secure & reliable access',
                '⚡ Fast performance',
                '📱 Works across devices',
              ].map((item, index) => (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    padding: 8,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ fontSize: 14, color: '#0F172A' }}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
  )
}

export default SoftwareInfo

 