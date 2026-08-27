import Svg, {
  Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop,
} from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

const SIZE = 184;

export function ZeroTaskIllustration() {
  const { colors } = useTheme();
  return <Svg width={SIZE} height={SIZE} viewBox="0 0 184 184" accessibilityLabel="Sakin bir fincan ve açık ajanda">
    <Defs>
      <RadialGradient id="zeroGlow"><Stop offset="0" stopColor={colors.accent} stopOpacity="0.18"/><Stop offset="1" stopColor={colors.accent} stopOpacity="0"/></RadialGradient>
      <LinearGradient id="zeroFill" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={colors.illustrationFill}/><Stop offset="1" stopColor={colors.illustrationGlowPrimary}/></LinearGradient>
    </Defs>
    <Circle cx="92" cy="92" r="76" fill="url(#zeroGlow)" />
    <Ellipse cx="93" cy="142" rx="61" ry="7" fill={colors.illustrationGlowSecondary}/>
    <Path d="M37 104 Q59 94 82 104 L82 139 Q58 130 37 139 Z" fill="url(#zeroFill)" stroke={colors.illustrationLine} strokeWidth="2" strokeLinejoin="round"/>
    <Path d="M147 104 Q124 94 102 104 L102 139 Q126 130 147 139 Z" fill="url(#zeroFill)" stroke={colors.illustrationLine} strokeWidth="2" strokeLinejoin="round"/>
    <Path d="M82 104 Q92 108 102 104 M92 108 V139" fill="none" stroke={colors.illustrationLine} strokeWidth="1.5" opacity="0.7"/>
    <Path d="M61 77 H111 V96 Q111 107 100 107 H72 Q61 107 61 96 Z" fill={colors.surface} stroke={colors.illustrationLine} strokeWidth="2"/>
    <Path d="M111 83 H118 Q127 83 127 91 Q127 99 116 99 H111" fill="none" stroke={colors.illustrationLine} strokeWidth="2"/>
    <Path d="M74 69 C68 61 80 57 74 48 M88 69 C82 60 94 55 88 45" fill="none" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" opacity="0.75"/>
    <Path d="M137 49 L139.5 56 L147 58.5 L139.5 61 L137 68 L134.5 61 L127 58.5 L134.5 56 Z" fill={colors.accent} opacity="0.9"/>
    <Circle cx="119" cy="48" r="2.5" fill={colors.success}/>
  </Svg>;
}

export function AllDoneIllustration() {
  const { colors } = useTheme();
  return <Svg width={SIZE} height={SIZE} viewBox="0 0 184 184" accessibilityLabel="Tamamlanmış hedef ve açan yaprak">
    <Defs><RadialGradient id="doneGlow"><Stop offset="0" stopColor={colors.success} stopOpacity="0.20"/><Stop offset="1" stopColor={colors.success} stopOpacity="0"/></RadialGradient></Defs>
    <Circle cx="92" cy="86" r="74" fill="url(#doneGlow)"/>
    <Circle cx="92" cy="78" r="43" fill={colors.surface} stroke={colors.success} strokeWidth="2.5"/>
    <Path d="M70 78 L85 93 L116 61" fill="none" stroke={colors.success} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M92 121 V143" stroke={colors.illustrationLine} strokeWidth="2.5" strokeLinecap="round"/>
    <Path d="M91 135 C74 132 70 120 71 111 C83 111 92 119 91 135 Z" fill={colors.illustrationGlowSecondary} stroke={colors.success} strokeWidth="2"/>
    <Path d="M93 130 C108 127 114 116 113 107 C101 108 93 116 93 130 Z" fill={colors.illustrationGlowSecondary} stroke={colors.success} strokeWidth="2"/>
    <Path d="M69 143 H115 L109 156 H75 Z" fill={colors.illustrationFill} stroke={colors.illustrationLine} strokeWidth="2" strokeLinejoin="round"/>
    <G fill={colors.accent}><Circle cx="40" cy="74" r="3"/><Circle cx="139" cy="92" r="2.5"/><Circle cx="132" cy="48" r="2"/></G>
    <Path d="M47 44 L49 50 L55 52 L49 54 L47 60 L45 54 L39 52 L45 50 Z" fill={colors.accent}/>
  </Svg>;
}

export function NoResultsIllustration() {
  const { colors } = useTheme();
  return <Svg width={SIZE} height={SIZE} viewBox="0 0 184 184" accessibilityLabel="Sonuç arayan minimalist büyüteç">
    <Defs><RadialGradient id="searchGlow"><Stop offset="0" stopColor={colors.accent} stopOpacity="0.15"/><Stop offset="1" stopColor={colors.accent} stopOpacity="0"/></RadialGradient></Defs>
    <Circle cx="88" cy="82" r="71" fill="url(#searchGlow)"/>
    <Circle cx="78" cy="75" r="35" fill={colors.illustrationFill} stroke={colors.illustrationLine} strokeWidth="3"/>
    <Path d="M103 100 L139 136" stroke={colors.illustrationLine} strokeWidth="10" strokeLinecap="round"/>
    <Path d="M105 102 L137 134" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" opacity="0.75"/>
    <Path d="M64 76 C70 68 86 67 93 76" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
    <Line x1="72" y1="89" x2="86" y2="89" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
    <G fill={colors.accent} opacity="0.75"><Circle cx="126" cy="57" r="3"/><Circle cx="142" cy="72" r="2"/><Circle cx="122" cy="42" r="1.8"/></G>
    <Path d="M145 99 L147 104 L152 106 L147 108 L145 113 L143 108 L138 106 L143 104 Z" fill={colors.success}/>
  </Svg>;
}
