import Arm3D from "./arm3D.js";
import * as THREE from './threejs/three.module.js';
import {STLLoader} from './threejs/STLLoader.js';
import Mankinematic from './mathjs/kinematic.js';
import FirebaseIOT from "./firebase.js";

// firebased
const appSetting = {
    databaseURL: "https://arm-iot-67286-default-rtdb.asia-southeast1.firebasedatabase.app/",
};
const dataIOT = new FirebaseIOT(appSetting);
const commendKeys = ["J1","J2","J3","J4","E"];

// buttons
const position_btns = ["#zplus-btn", "#zneg-btn","#xplus-btn", "#xneg-btn"];
const set_position = ["ZP","ZN","XP","XN"];
const UPjoin_btns = ["#btn-up-join1","#btn-up-join2","#btn-up-join3","#btn-up-join4"];
const DOWNjoin_btns = ["#btn-down-join1","#btn-down-join2","#btn-down-join3","#btn-down-join4"];
const stepvalue = [50, -50];
// current angle
const join_currents = ["#cur-join1","#cur-join2","#cur-join3","#cur-join4"];
// initial data
var init_data = [2045,2045,2045,2045];

// EndEffector
const end_btns = ["#end-inc-btn","#end-des-btn"];
const end_btn_value = [2048, -2048];

// Mathjs and kinematic
var manKi = new Mankinematic(init_data);

// Threejs
const robot_parts = [
    {
        name: 'base',
        coordinate: new THREE.Object3D(),
        path: './static/js/threejs/model/DUMMY_DC12.stl',// Must be fixed
        angle: {x:-Math.PI/2, y:0, z:0},
        position: {x: 0,y:0,z:0,},
        colors: { color: '#4CAF50', specular: 0x111111, shininess: 10 },
        axis_rotate: '0',
        calibrate: 0,
    },
    {
        name: 'link1',
        coordinate: new THREE.Object3D(),
        path: './static/js/threejs/model/Link_01.stl',
        angle: {x:Math.PI/2, y: Math.PI/2, z:0},   
        // rotation angle y: -MATH.PI/2 = initial point
        position: {x: 0,y:0,z:3,},
        colors: { color: 'blue', specular: 0x111111, shininess: 10 },
        axis_rotate: 'Y',
        calibrate: Math.PI/2,
    },
    {
        name: 'link2',
        coordinate: new THREE.Object3D(),
        path: './static/js/threejs/model/Link_02.stl',
        angle: {x:Math.PI/2, y:Math.PI/2, z: -Math.PI/2},  
        // rotation angle y: MATH.PI/2 = initial point
        position: {x: 0,y:0,z:0,},
        colors: { color: 'red', specular: 0x111111, shininess: 10 },
        axis_rotate: 'Y',
        calibrate: Math.PI/2,
    },
    {
        name: 'link3',
        coordinate: new THREE.Object3D(),
        path: './static/js/threejs/model/Link_03.stl',
        angle: {x:Math.PI/2, y:0, z:0},  
        // rotation angle x MATH.PI/2 = initial point
        position: {x:0,y:6.4,z: 1.2,},
        colors: { color: 'yellow', specular: 0x111111, shininess: 10},
        axis_rotate: 'X',
        calibrate: Math.PI/2,
    },
    {
        name: 'link4',
        coordinate: new THREE.Object3D(),
        path: './static/js/threejs/model/Link_04_ex.stl',
        angle: {x:0, y: 0, z:0},           
        // rotation angle x 0 = initial point
        position: {x: 0,y:6.2,z:0},
        colors: { color: 'green', specular: 0x111111, shininess: 10 },
        axis_rotate: 'X',
        calibrate: 0,
    },
    {
        name: 'extension',
        coordinate: new THREE.Object3D(),
        path: './static/js/threejs/model/Extension.stl',// Must be fixed
        angle: {x:0, y:0, z:0},
        position: {x: 0,y:5,z:0,},
        colors: { color: 'black', specular: 0x111111, shininess: 10 },
        axis_rotate: 'D',
        calibrate: 0,
    },
];

const scaleRatio = 0.05;  
const stlLoader = new STLLoader();
const loadRobots = (manipulator) =>{
    // Join
    robot_parts.forEach((part)=>{
        stlLoader.load(part.path, (root)=>{
            // root.center();
            let mater1 = new THREE.MeshPhongMaterial(part.colors)
            let mesh1 = new THREE.Mesh(root, mater1);
            mesh1.name = part.name;
            mesh1.scale.set(scaleRatio, scaleRatio, scaleRatio);
            let axesHelper = new THREE.AxesHelper(2);
            part.coordinate.add(mesh1);
            part.coordinate.add( axesHelper);
            part.coordinate.rotation.set(part.angle.x,part.angle.y, part.angle.z);
            part.coordinate.position.set(part.position.x, part.position.y, part.position.z);
        });
    });
    
    // add coordinate
    for(let i = 1; i < robot_parts.length; ++i){
        robot_parts[i-1].coordinate.add(robot_parts[i].coordinate);
    };

    let sceneAxis = new THREE.AxesHelper(11);
    manipulator.scene.add(sceneAxis);
    manipulator.scene.add(robot_parts[0].coordinate);
};
const update_data = (data)=>{
    // console.log(data);
    data.forEach((raw, index)=>{
        let g_rad = raw*0.088*Math.PI/180;
        let axisRot =robot_parts[index+1].axis_rotate;
        let goal_rad = (g_rad-Math.PI) + robot_parts[index+1].calibrate;
        // let goal_rad = targetGoal[i]
        if(axisRot == "X"){
            robot_parts[index+1].coordinate.rotation.x = goal_rad;
        }else if(axisRot == "Y"){
            robot_parts[index+1].coordinate.rotation.y = goal_rad;
        }else if(axisRot == "Z"){
            robot_parts[index+1].coordinate.rotation.z = goal_rad;
        };
    });  
    manKi.raw_current.forEach((raw, index)=>{
        $(join_currents[index]).text(Math.floor(raw*0.088)-90);
    });
    $("#Tmatrices-container").empty();
    manKi.cur_T.forEach((value)=>{
        // console.log(value);
        let temptdiv = $("<div></div>").text(`${Math.floor(1000*value)/1000}`)
        $("#Tmatrices-container").append(temptdiv);
    });
};

const update_extention = (data)=>{
    robot_parts[5].coordinate.position.y = 5 + math.floor(data/2045);
};

const solveINV = (rad_phi0, targetT)=>{
    let solve_goal1 = manKi.manInvKi1(math.matrix(rad_phi0), targetT);
    let solve_goal2 = manKi.manInvKi2(math.matrix(rad_phi0), targetT);
    return (solve_goal1.isSolve)? solve_goal1: solve_goal2;
};

const sendData = (data)=>{
    let containData = [...data];
    containData.push(manKi.endEffector);
    containData.forEach((cm, index)=>{
        dataIOT.updateCommend(commendKeys[index], cm);
    });
};

$(document).ready(()=>{
    
    var canvas = document.getElementById('arm-view');
    var manipulator = new Arm3D(canvas);

    $('#btn-open-tab').click(()=>{
        $('#div-reference-tab').show();
    });

    $('#btn-close-tab').click(()=>{
        $('#div-reference-tab').css("display","none");
    });
    // Button
    $('#home-btn').click(()=>{
        // reset the setting.
        $('#dis-step-input').val(1);
        $('#rot-step-output').val(10);
        $('#step-ext-output').val(1); 

        manKi.update_endEffector(0);
        manKi.update_cur_angle(init_data);
        // console.log(manKi.raw_current);
        sendData(init_data);
    });

    $('#setting-btn').click(()=>{
        $('#setting-hide-contains').css("display","block");
    });
    $('#okay-setting-btn').click(()=>{
        $('#setting-hide-contains').css("display","none");
    });

      
    // Control button

    for(let i = 0; i<4; i++){
        $(position_btns[i]).click(()=>{
            let step_position_val = ($('#dis-step-input').val())*0.01;
            let targetT = [];  
            let rad_cur = manKi.cvRawtoRad(manKi.raw_current);         
            // rotate the coordinate to XOY => join1 always = 0;
            if(set_position[i]==="ZP" || set_position[i]==="ZN"){
                if(set_position[i]==="ZP"){
                    targetT = math.add(manKi.cur_T, math.matrix([[0,0,0,0],[0,0,0,0],[0,0,0,step_position_val],[0,0,0,0]]));
                }else{
                    targetT = math.add(manKi.cur_T, math.matrix([[0,0,0,0],[0,0,0,0],[0,0,0,-1*step_position_val],[0,0,0,0]]));
                };
                let resultINV = solveINV(rad_cur, targetT);
                if(resultINV.isSolve === true){
                    // console.log("It's solved!");
                    manKi.update_cur_angle(manKi.cvRadtoRaw(resultINV.phifinal));
                    sendData(manKi.raw_current);
                }else{
                    alert("The manipulator reaches the limitation!");
                };

            }else if(set_position[i]==="XP" || set_position[i]==="XN"){
                let rotationAngle = [2045, manKi.raw_current[1],manKi.raw_current[2],manKi.raw_current[3]];
                let rotMatrixT= manKi.manForwardKi(math.matrix(manKi.cvRawtoRad(rotationAngle)));
                if(set_position[i]==="XP"){
                    targetT = math.add(rotMatrixT, math.matrix([[0,0,0,step_position_val],[0,0,0,0],[0,0,0,0],[0,0,0,0]]));
                }else{
                    targetT = math.add(rotMatrixT, math.matrix([[0,0,0,-1*step_position_val],[0,0,0,0],[0,0,0,0],[0,0,0,0]]));
                };
                let resultINV = solveINV(rotationAngle, targetT);
                if(resultINV.isSolve === true){
                    // console.log("It's solved!");
                    let frozenCur = math.flatten(resultINV.phifinal);
                    // console.log(frozenCur.get([1]));
                    let tempfinal = [rad_cur[0], frozenCur.get([1]),frozenCur.get([2]),frozenCur.get([3])];
                    manKi.update_cur_angle(manKi.cvRadtoRaw(tempfinal)); 
                    sendData(manKi.raw_current);
                }else{
                    alert("The manipulator reaches the limitation!");
                };            
            }
        });

        $(UPjoin_btns[i]).click(()=>{
            let maxvalue = 3068;
            let step_rot_val = ($('#rot-step-output').val())*12;
            if(manKi.raw_current[i] + step_rot_val <= maxvalue ){
                let temp = [0,0,0,0];
                let tempRaw = [...manKi.raw_current];
                temp[i] = manKi.raw_current[i] + step_rot_val;
                tempRaw[i] = manKi.raw_current[i] + step_rot_val;      
                manKi.update_cur_angle(tempRaw);
                sendData(temp);
            };
        });
        $(DOWNjoin_btns[i]).click(()=>{
            let minvalue = 1023;
            let step_rot_val = ($('#rot-step-output').val())*12;
            if(manKi.raw_current[i] - step_rot_val >= minvalue){
                let temp = [0,0,0,0];
                let tempRaw = [...manKi.raw_current];
                temp[i] = manKi.raw_current[i] - step_rot_val;
                tempRaw[i] = manKi.raw_current[i] - step_rot_val;    
                manKi.update_cur_angle(tempRaw);
                sendData(temp);
            };
        });
    };
    // endeffector control
    
    end_btns.forEach((btn, index)=>{
        $(btn).click(()=>{
            let step_ext_val = ($('#step-ext-output').val())*end_btn_value[index];
            if(manKi.endEffector + step_ext_val <= 14336 && manKi.endEffector + step_ext_val >=0){
                manKi.update_endEffector(manKi.endEffector + step_ext_val);
                sendData([0,0,0,0]);
            };
        });
    });

    manipulator.init();
    loadRobots(manipulator);
    
    // manKi.update_cur_angle(dataIOT.getSensorSignal());
    // console.log(dataIOT.getSensorSignal())
    function render() {
        let joinSignal = dataIOT.getSensorSignal();
        joinSignal.forEach((angle)=>{
            manKi.update_cur_angle(angle);
        });
        update_data(manKi.raw_current);
        update_extention(manKi.endEffector);
        manKi.raw_current.forEach((raw, index)=>{
            $(join_currents[index]).text(Math.floor(raw*0.088)-90);
        });
        manipulator.drawing(canvas);
        requestAnimationFrame(render);
        manKi.update_render(false);
    };
    requestAnimationFrame(render);
}); 