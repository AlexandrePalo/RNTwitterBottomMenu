import React, { useRef, useState, useLayoutEffect } from 'react'
import {
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    View,
    StyleSheet,
    PanResponder,
    Text,
    Dimensions,
} from 'react-native'

const { height, width } = new Dimensions.get('window')

const menuOptions = [
    'Save this image',
    'Delete post',
    'More info',
    'Follow account',
]

export default function App() {
    const [bottomMenu, setBottomMenu] = useState(false)

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => setBottomMenu(true)}>
                <Text style={styles.titleText}>Open</Text>
            </TouchableOpacity>

            {bottomMenu && (
                <BottomMenu close={() => setBottomMenu(false)}>
                    {menuOptions.map((o, i) => (
                        <Text
                            key={`menu-option-${i}`}
                            style={styles.menuOption}
                        >
                            {o}
                        </Text>
                    ))}
                </BottomMenu>
            )}
        </View>
    )
}

const BottomMenu = ({ close, children }) => {
    const menu = useRef(null)
    const mH = useRef(height) // Default full height, adjusted on layout
    const pan = useRef(new Animated.ValueXY({ x: 0, y: mH.current })).current // start closed

    useLayoutEffect(() => {
        // Open on start
        Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            bounciness: 0,
        }).start()
    })

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (e, s) => {
                // Always grant the move
                return true
            },
            onPanResponderGrant: (e, s) => {
                // ...
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                })
            },
            onPanResponderMove: (e, s) => {
                // Map s state to pan on move
                return Animated.event([null, { dx: pan.x, dy: pan.y }])(e, s)
            },
            onPanResponderRelease: (e, s) => {
                // At the end of the move

                pan.flattenOffset() // Reset offset (dx -> x, dy -> y)

                // Check where the move ends at regarding the menu height
                menu.current.getNode().measure((x, y, w, h, pX, pY) => {
                    // pY : y position in the page
                    if (pY >= height - mH.current / 2) {
                        // More than half of the menu down --> close fully
                        Animated.spring(pan, {
                            toValue: { x: 0, y: mH.current },
                            overshootClamping: true,
                        }).start(() => {
                            close()
                        })
                    } else {
                        // Less than half of the menu down --> reopen fully
                        Animated.spring(pan, {
                            toValue: { x: 0, y: 0 },
                            bounciness: 0,
                        }).start()
                    }
                })
            },
        })
    ).current

    return (
        <View
            style={{
                ...StyleSheet.absoluteFill,
            }}
        >
            <TouchableWithoutFeedback
                onPress={() => {
                    // Close menu when press outside the menu
                    Animated.spring(pan, {
                        toValue: { x: 0, y: mH.current },
                        overshootClamping: true,
                    }).start(() => {
                        close()
                    })
                }}
            >
                <View
                    style={{
                        ...StyleSheet.absoluteFill,
                        backgroundColor: 'rgba(100,100,100,0.5)',
                    }}
                />
            </TouchableWithoutFeedback>
            <Animated.View
                style={{
                    transform: [
                        {
                            translateY: pan.y.interpolate({
                                inputRange: [0, mH.current],
                                outputRange: [0, mH.current],
                                extrapolateLeft: 'clamp',
                            }),
                        },
                    ],
                    ...styles.menuPanView,
                }}
                {...panResponder.panHandlers}
                ref={menu}
            >
                <View
                    style={styles.menu}
                    onLayout={(e) => {
                        // Save height (variable due to children) into mH
                        mH.current = e.nativeEvent.layout.height
                    }}
                >
                    <View style={styles.bar} />
                    {children}
                </View>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    menuPanView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    menu: {
        width,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
    },
    bar: {
        width: 64,
        height: 12,
        borderRadius: 999,
        backgroundColor: '#e2e8f0',
        marginBottom: 20,
    },
    menuOption: {
        fontSize: 16,
        color: '#2d3748',
        paddingTop: 6,
        paddingBottom: 6,
    },
})
