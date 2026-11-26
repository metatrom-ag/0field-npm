#!/usr/bin/env node
import '../0field.js'

/**
 * Purpose: start `o` as a human types it.
 *
 * Intention: the started file of the `o` binary; names its Cli model,
 * `o.jsonld` beside it, which the 0field restores and starts with
 * every word after this file as the human's — or, where the first word is
 * an oField IRI, `open.jsonld`, the Launcher that opens what it names.
 */
export default new URL(process.argv[2]?.startsWith('ofield://') ? './open.jsonld' : './o.jsonld', import.meta.url)
