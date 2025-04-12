import * as THREE from './js/three.module.js'
import * as CANNON from './js/cannon-es.js'

/**
 * 封装第三人称类
 */
export class CharacterControls {


	constructor(model, mixer, animationsMap, orbitControl, camera, currentAction, model1) {
		this.model = model
		this.mixer = mixer
		this.animationsMap = animationsMap
		this.currentAction = currentAction
		this.animationsMap.forEach((value, key) => {
			if (key == currentAction) {
				value.play()
			}
		})
		this.orbitControl = orbitControl
		this.camera = camera
		this.model1 = model1



		this.toggleRun = true
		// temporary data
		this.walkDirection = new THREE.Vector3()
		//旋转的轴 y轴
		this.rotateAngle = new THREE.Vector3(0, 1, 0)
		//四元数
		this.rotateQuarternion = new THREE.Quaternion()
		this.cameraTarget = new THREE.Vector3()
		//动作切换时间
		this.fadeDuration = 0.2
		//跑步速度
		this.runVelocity = 50
		//走路速度
		this.walkVelocity = 2
		this.DIRECTIONS = ['w', 'a', 's', 'd']
	}

	switchRunToggle() {
		this.toggleRun = !this.toggleRun
	}

	/**
	 * 计算wasd这4个按键后的旋转角度
	 * 计算规则：向前w 角度0    		w+a 逆时针45°   w+d 顺时针45°
	 * 			向后s 角度逆时针180° 	s+a 逆时针135°  s+d 顺时针135°
	 * 			向左a 逆时针90°
	 * 			向右d 顺时针90°
	 * @param keysPressed
	 */
	directionOffset(keysPressed) {
		var directionOffset = 0 // w
		if (keysPressed['w']) {
			if (keysPressed['a']) {
				directionOffset = Math.PI / 4
			} else if (keysPressed['d']) {
				directionOffset = -Math.PI / 4
			}
		} else if (keysPressed['s']) {
			if (keysPressed['a']) {
				directionOffset = Math.PI / 4 + Math.PI / 2
			} else if (keysPressed['d']) {
				directionOffset = -Math.PI / 4 - Math.PI / 2
			} else {
				directionOffset = Math.PI
			}
		} else if (keysPressed['a']) {
			directionOffset = Math.PI / 2
		} else if (keysPressed['d']) {
			directionOffset = -Math.PI / 2
		}
		return directionOffset;
	}


	//动作更新
	update(delta, keysPressed) {

		//directionPressed 判断是否按下设定好的按键， 有的话为true
		const directionPressed = this.DIRECTIONS.some(key => keysPressed[key] == true)
		var play = '';
		//如果按下 wasd这几个按键， 就改成走路或者跑步状态，否者就是停止状态
		if (window.d > 50 || directionPressed && this.toggleRun) {
			play = 'Run'
		} else if (window.d > 0 || directionPressed) {
			play = 'Walk'
		} else {
			play = 'Idle'
		}
		if (this.IsPhone()) {
			if (window.d > 50) {
				play = 'Run'
			} else if (window.d > 0) {
				play = 'Walk'
			} else {
				play = 'Idle'
			}
		} else {
			if (directionPressed && this.toggleRun) {
				play = 'Run'
			} else if (directionPressed) {
				play = 'Walk'
			} else {
				play = 'Idle'
			}
		}
		//如果当前不是运动状态，就切换动画
		if (this.currentAction != play) {
			const toPlay = this.animationsMap.get(play)
			const current = this.animationsMap.get(this.currentAction)
			current.fadeOut(this.fadeDuration)
			toPlay.reset().fadeIn(this.fadeDuration).play();
			this.currentAction = play
		}
		this.mixer.update(delta)


		//计算运动的时候转向的角度
		if (this.currentAction == 'Run' || this.currentAction == 'Walk') {
			//1: 先计算 相机和机器人的夹角
			var angleYCameraDirection = Math.atan2((this.camera.position.x - this.model.position.x), (this.camera.position.z - this.model.position.z));
			//2:然后计算 wasd按键后的旋转角度，写个函数来计算
			var directionOffset = this.directionOffset(keysPressed)
			if (this.IsPhone()) {
				directionOffset = -(window.rad + Math.PI / 2);
			}
			// rotate model 旋转模型,算出四元数旋转的角度，然后旋转模型
			// 从由 axis（轴） 和 angle（角度）所给定的旋转来设置该四元数。改编自 here 所述的方法。假定Axis已被归一化，angle以弧度来表示。
			this.rotateQuarternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset)
			//计算机器人旋转起来
			// q - 目标四元数 step - 以弧度为单位的角度步长
			this.model1.quaternion.rotateTowards(this.rotateQuarternion, 0.2)
			//3. 让机器人和相机移动
			this.camera.getWorldDirection(this.walkDirection)
			this.walkDirection.y = 0
			this.walkDirection.normalize()
			// axis - 一个被归一化的Vector3。angle - 以弧度表示的角度。
			this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset)
			//velocity为机器人速度
			const velocity = this.currentAction == 'Run' ? this.runVelocity : this.walkVelocity
			const moveX = this.walkDirection.x * velocity * delta
			const moveZ = this.walkDirection.z * velocity * delta
			//移动机器人
			this.model.position.x += moveX
			this.model.position.z += moveZ
			//相机更新位置

		}
		// 调整摄像机
		this.camera.position.sub(this.orbitControl.target); //减去向量
		this.orbitControl.target.copy(this.model.position);
		this.camera.position.add(this.model.position);

		this.model1.position.copy(this.model.position);
		this.model1.position.y = this.model.position.y - 0.5;
		this.model.quaternion.setFromAxisAngle(new CANNON.Vec3(0, -1, 0), 0);
	}
	IsPhone() {
		//获取浏览器navigator对象的userAgent属性（浏览器用于HTTP请求的用户代理头的值）
		var info = navigator.userAgent;
		//通过正则表达式的test方法判断是否包含“Mobile”字符串
		var isPhone = /mobile/i.test(info);
		//如果包含“Mobile”（是手机设备）则返回true
		return isPhone;
	}
}
