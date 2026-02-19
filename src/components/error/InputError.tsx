import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useRef } from 'react'
import { ERP_COLOR_CODE } from '../../utils/constants';

const InputError = ({ error }: any) => {
    const errorAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (error) {
            errorAnim.setValue(0);
            Animated.timing(errorAnim, {
                toValue: 1,
                duration: 380,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }).start();
        }
    }, [error]);
    return (
        <View>
            {!!error && (
                <Animated.Text
                    style={[
                        styles.errorText,
                        {
                            opacity: errorAnim,
                            transform: [
                                {
                                    translateX: errorAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-58, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {error}
                </Animated.Text>
            )}
        </View>
    )
}

export default InputError


export const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 6,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: ERP_COLOR_CODE.ERP_333,
    },
    inputWrapper: {
        position: 'relative',
        justifyContent: 'center',
    },
    input: {
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        width: '94%',
        color: ERP_COLOR_CODE.ERP_BLACK,
    },
    toggleButton: {
        position: 'absolute',
        right: 14,
        top: -4,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    helperText: {
        fontSize: 12,
        color: ERP_COLOR_CODE.ERP_666,
        marginTop: 4,
    },
    errorText: {
        fontSize: 12,
        color: ERP_COLOR_CODE.ERP_ERROR,
        marginTop: 4,
    },
});
