// Each instrument owns its markup, artwork and preview. Playback remains shared.
import {themeMarkup as classicMarkup,themePreview as classicPreview} from './read-themes/classic.js';
import {themeMarkup as cyberdeckMarkup,themePreview as cyberdeckPreview} from './read-themes/cyberdeck.js';
import {themeMarkup as phosphorMarkup,themePreview as phosphorPreview} from './read-themes/phosphor.js';
import {themeMarkup as mixtapeMarkup,themePreview as mixtapePreview} from './read-themes/mixtape.js';
import {themeMarkup as orbitalMarkup,themePreview as orbitalPreview} from './read-themes/orbital.js';
import {themeMarkup as nocturneMarkup,themePreview as nocturnePreview} from './read-themes/nocturne.js';
export const readInstruments={
 classic:{markup:classicMarkup,preview:classicPreview},
 cyberdeck:{markup:cyberdeckMarkup,preview:cyberdeckPreview},
 phosphor:{markup:phosphorMarkup,preview:phosphorPreview},
 mixtape:{markup:mixtapeMarkup,preview:mixtapePreview},
 orbital:{markup:orbitalMarkup,preview:orbitalPreview},
 nocturne:{markup:nocturneMarkup,preview:nocturnePreview},
};
export function instrumentMarkup(props){return readInstruments[props.presentation].markup(props);}
