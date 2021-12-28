
import { get } from 'lodash'
import memoize from 'utils/memoize'
import { createSelector } from 'reselect'
import { disposeScene, positionCamera } from 'utils/three'
import {
  selectors as gameSelectors,
} from 'morpheus/game'
import {
  actions as gamestateActions,
  selectors as gamestateSelectors,
  isActive,
} from 'morpheus/gamestate'
import {
  selectors as castSelectors,
} from 'morpheus/casts'
import { GESTURES } from 'morpheus/constants'
import { isPano, isHotspot } from '../matchers'


const selectors = memoize(scene => {
  const selectSceneCache = castSelectors.forScene(scene).cache
  const selectHotspot = createSelector(
    selectSceneCache,
    cache => get(cache, 'hotspot'),
  )

  const selectHotspotsData = createSelector(
    () => scene,
    s => get(s, 'casts', []).filter(c => c.castId === 0),
  )

  const selectWebgl = createSelector(
    selectHotspot,
    hotspot => get(hotspot, 'webgl'),
  )

  const selectCanvas = createSelector(
    selectWebgl,
    ({ canvas }) => canvas,
  )

  const selectIsPano = createSelector(
    () => scene,
    sceneData => {
      const { casts } = sceneData
      return !!casts.find(c => c.__t === 'PanoCast')
    },
  )

  return {
    isPano: selectIsPano,
    webgl: selectWebgl,
    hotspotsData: selectHotspotsData,
    canvas: selectCanvas,
  }
})

export const delegate = memoize(scene => {
  function applies() {
    return scene.casts.find(isHotspot) && isPano(scene)
  }

  function doEnter({ webGlPool }) {
    return (dispatch, getState) => {
      if (isPano(scene)) {
        return webGlPool.acquire().then(webgl => {
          const { width, height } = gameSelectors.dimensions(getState())
          webgl.setSize({ width, height })
          return {
            webgl,
          }
        })
      }
      return Promise.resolve({})
    }
  }

  function onStage({ hotspotsData, scene3D, webgl }) {
    return (dispatch, getState) => {
      const gamestates = gamestateSelectors.forState(getState())
      hotspotsData
        .filter(cast => isActive({ cast, gamestates }))
        .forEach(hotspot => {
          const { gesture } = hotspot
          if (
            GESTURES[gesture] === 'Always' ||
            GESTURES[gesture] === 'SceneEnter'
          ) {
            dispatch(gamestateActions.handleHotspot({ hotspot }))
          }
        })

      return Promise.resolve()
    }
  }

  function doUnload({ webGlPool, scene3D, webgl }) {
    return () => {
      if (scene3D) {
        disposeScene(scene3D)

        return webGlPool.release(webgl).then(() => ({
          webgl: null,
          isLoaded: false,
          isLoading: null,
        }))
      }
      return Promise.resolve()
    }
  }

  return {
    applies,
    doEnter,
    onStage,
    doUnload,
  }
})
