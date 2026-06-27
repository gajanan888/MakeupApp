import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (iPhone X/11/12/13/14 mini)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Limit the scaling factor for large screens (tablets) so layouts don't blow up too much
const maxScaleFactor = 1.35; 
const scaleFactor = Math.min(width / guidelineBaseWidth, maxScaleFactor);
const heightScaleFactor = Math.min(height / guidelineBaseHeight, maxScaleFactor);

export const scale = (size) => scaleFactor * size;
export const verticalScale = (size) => heightScaleFactor * size;
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Properties that should be scaled and their corresponding functions
const scaleProperties = {
  // Horizontal scaling
  width: scale,
  minWidth: scale,
  maxWidth: scale,
  left: scale,
  right: scale,
  marginLeft: scale,
  marginRight: scale,
  marginHorizontal: scale,
  paddingLeft: scale,
  paddingRight: scale,
  paddingHorizontal: scale,
  
  // Vertical scaling
  height: verticalScale,
  minHeight: verticalScale,
  maxHeight: verticalScale,
  top: verticalScale,
  bottom: verticalScale,
  marginTop: verticalScale,
  marginBottom: verticalScale,
  marginVertical: verticalScale,
  lineHeight: verticalScale,
  
  // Moderate scaling (usually for fonts, borders, paddings, margins, gaps)
  fontSize: (val) => moderateScale(val, 0.3),
  borderRadius: (val) => moderateScale(val, 0.3),
  borderTopLeftRadius: (val) => moderateScale(val, 0.3),
  borderTopRightRadius: (val) => moderateScale(val, 0.3),
  borderBottomLeftRadius: (val) => moderateScale(val, 0.3),
  borderBottomRightRadius: (val) => moderateScale(val, 0.3),
  margin: (val) => moderateScale(val, 0.3),
  padding: (val) => moderateScale(val, 0.3),
  gap: (val) => moderateScale(val, 0.3),
  rowGap: (val) => moderateScale(val, 0.3),
  columnGap: (val) => moderateScale(val, 0.3),
};

// Save original StyleSheet.create
const originalCreate = StyleSheet.create;

// Override StyleSheet.create
StyleSheet.create = (styles) => {
  if (!styles) return originalCreate(styles);
  
  const scaledStyles = {};
  
  for (const styleKey in styles) {
    if (Object.prototype.hasOwnProperty.call(styles, styleKey)) {
      const style = styles[styleKey];
      if (style && typeof style === 'object') {
        const scaledStyle = {};
        for (const prop in style) {
          if (Object.prototype.hasOwnProperty.call(style, prop)) {
            const value = style[prop];
            // Only scale numeric values that are present in our scaling mappings
            if (typeof value === 'number' && scaleProperties[prop]) {
              scaledStyle[prop] = scaleProperties[prop](value);
            } else {
              scaledStyle[prop] = value;
            }
          }
        }
        scaledStyles[styleKey] = scaledStyle;
      } else {
        scaledStyles[styleKey] = style;
      }
    }
  }
  
  return originalCreate(scaledStyles);
};
