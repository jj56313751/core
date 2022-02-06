import { isFunction } from '@vue/shared'
import { currentInstance } from './component'
import { currentRenderingInstance } from './componentRenderContext'
import { warn } from './warning'

export interface InjectionKey<T> extends Symbol {}

export function provide<T>(key: InjectionKey<T> | string | number, value: T) {
  if (!currentInstance) {
    if (__DEV__) {
      warn(`provide() can only be used inside setup().`)
    }
  } else {
    let provides = currentInstance.provides
    // by default an instance inherits its parent's provides object
    // but when it needs to provide values of its own, it creates its
    // own provides object using parent provides object as prototype.
    // this way in `inject` we can simply look up injections from direct
    // parent and let the prototype chain do the work.
    //默认情况下，实例继承父类的provides对象
    //但是当它需要提供自己的provide时，它使用父provide对象作为原型来创建自己的provide对象。。
    //在' inject '中，我们可以简单地从direct中查找注入父函数，让原型链做这些工作。
    const parentProvides =
      currentInstance.parent && currentInstance.parent.provides
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides)
    }
    // TS doesn't allow symbol as index type
    provides[key as string] = value
  }
}

export function inject<T>(key: InjectionKey<T> | string): T | undefined
export function inject<T>(
  key: InjectionKey<T> | string,
  defaultValue: T,
  treatDefaultAsFactory?: false
): T
export function inject<T>(
  key: InjectionKey<T> | string,
  defaultValue: T | (() => T),
  treatDefaultAsFactory: true
): T
export function inject(
  key: InjectionKey<any> | string,
  defaultValue?: unknown,
  treatDefaultAsFactory = false
) {
  // fallback to `currentRenderingInstance` so that this can be called in
  // a functional component
  // 回退到' currentRenderingInstance '以便它可以被一个functional components调用
  const instance = currentInstance || currentRenderingInstance
  if (instance) {
    // #2400
    // to support `app.use` plugins,
    // 支持 `app.use`,
    // fallback to appContext's `provides` if the intance is at root
    // 如果实例是在根目录,回退到appContext的' provides '中
    const provides =
      instance.parent == null
        ? instance.vnode.appContext && instance.vnode.appContext.provides
        : instance.parent.provides

    if (provides && (key as string | symbol) in provides) {
      // TS doesn't allow symbol as index type
      return provides[key as string]
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction(defaultValue)
        ? defaultValue.call(instance.proxy)
        : defaultValue
    } else if (__DEV__) {
      warn(`injection "${String(key)}" not found.`)
    }
  } else if (__DEV__) {
    warn(`inject() can only be used inside setup() or functional components.`)
  }
}
