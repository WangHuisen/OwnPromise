// 定义三种状态
const PENDING = 'pending'
const RESOLVED = 'resolved'
const REJECTED = 'rejected'

function OwnPromise(executor) {
  // 初始化状态
  let self = this
  self.status = PENDING
  self.value = null
  self.error = null
  self.onFulfilledCallbacks = []
  self.onRejectedCallbacks = []
  // 定义resolve方法
  const resolve = (value) => {
    if(self.status === PENDING) { // 排除重复解决的可能性
      self.status = RESOLVED
      self.value = value
      self.onFulfilledCallbacks.forEach(callback => callback(self.value)) // 逐个执行回调函数数组
    }
  }
  // 定义reject方法
  const reject = (error) => {
    if(self.status === PENDING) { // 排除重复解决的可能性
      self.status = REJECTED
      self.error = error
      self.onRejectedCallbacks.forEach(callback => callback(self.error))
    }
  }
  // 执行传入的函数
  executor(resolve, reject)
}
// 定义thenable接口
OwnPromise.prototype.then = function(onFulfilled, onRejected) {
  let self = this
  // 成功回调不传给它一个默认函数
  onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value
  // 对于失败回调直接抛错
  onRejected = typeof onRejected === "function" ? onRejected : error => { throw error }
  if(this.status == PENDING) {
    return backPromise = new OwnPromise((resolve, reject) => {
      self.onFulfilledCallbacks.push(value => {
        setTimeout(() => {
          try {
            let x = onFulfilled(value)
            resolvePromise(backPromise, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        }, 0)
      })
      self.onRejectedCallbacks.push(error => {
        setTimeout(() => {
          try {
            let x = onRejected(error)
            resolvePromise(backPromise, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        }, 0)
      })
    })
  } else if (this.status === RESOLVED) {
    return backPromise = new OwnPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          x = onFulfilled(self.value)
          resolvePromise(backPromise, x, resolve, reject)
        } catch(e) {
          reject(e)
        }
      }, 0)
    })
  } else if (this.status === REJECTED) {
    return backPromise = new OwnPromise((resolve, reject) => {
      setTimeout(() => {
        try {
          x = onRejected(self.error)
          resolvePromise(backPromise, x, resolve, reject)
        } catch(e) {
          reject(e)
        }
      }, 0)
    })
  } else {
    return this
  }
}
// catch是then(null, onRejected)的语法糖
OwnPromise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected)
}
// 单独定义解析返回Promise的方法
function resolvePromise(backPromise, x, resolve, reject) {
  // 排除重复引用的情况
  if(backPromise === x) {
    return reject(new TypeError('重复引用相同的Promise!'));
  }
  if (x instanceof OwnPromise) {
    if (x.status === PENDING) {
      x.then(y => {
        resolvePromise(backPromise, y, resolve, reject)
      }, error => {
        reject(error)
      })
    } else {
      x.then(resolve, reject)
    }
  } else {
    resolve(x)
  }
}

// 实例测试
const asyncTask = function(name) {
  return new OwnPromise(function(resolve, reject) {
    try {
      resolve(name)
    } catch(e) {
      reject('出错了' + e)
    }
  })
}

asyncTask('first')
.then(name => {
  console.log(name)
  return asyncTask('second')
})
.then((name) => {
  console.log(name)
  return asyncTask('third')
})
.then(name => {
  console.log(name)
  return asyncTask('forth')
})
