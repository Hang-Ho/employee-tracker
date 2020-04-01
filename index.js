const mysql = require("mysql");
const inquirer = require("inquirer");
require("console.table");
var employeeList = [];
var managerList = [];
var departmentList = [];
const connection = mysql.createConnection({
    host: "localhost",
    port: "3306",
    user: "root",
    password: "password",
    database: "employee_trackerDB"
});
connection.connect(function (err) {
    if (err) throw err;
    menu();
});
function menu() {
    inquirer.prompt(
        {
            type: "rawlist",
            name: "choice",
            message: "What would you like to do?",
            choices: ["View all employees", "View all employee by department", "View all employee by manager", "Add employee","Add department","Add role", "Remove employee", "Remove department", "Remove role", "Update employee role", "Update employee manager", "View total utilized budget of a department", "Exit"]
        }
    ).then(answer => {
        if (answer.choice === "View all employees") {
            viewAll();
        } else if (answer.choice === "View all employee by department") {
            viewByDepartment();
        } else if (answer.choice === "View all employee by manager") {
            viewByManager();
        } else if (answer.choice === "Add employee") {
            addEmployee();
        } else if (answer.choice === "Add department") {
            addDepartment();
        } else if (answer.choice === "Add role") {
            addRole();
        } else if (answer.choice === "Remove employee") {
            removeEmployee();
        } else if (answer.choice === "Remove department") {
            removeDepartment();
        } else if (answer.choice === "Remove role") {
            removeRole();
        } else if (answer.choice === "Update employee role") {
            updateRole();
        } else if (answer.choice === "Update employee manager") {
            updateManager();
        } else if (answer.choice === "View total utilized budget of a department"){
            viewBudget();
        } else {
            connection.end();
        }
    });
};
function lookupName() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT first_name, last_name FROM employee;`, function (err, data) {
            resolve(data)
        });
    });
};
function lookupRole() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT title FROM role;`, function (err, data) {
            resolve(data);
        });
    });
};
function lookupDepartment() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT name FROM department;', function (err, data) {
            resolve(data);
        });
    });
};
function lookupManager() {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT CONCAT(employee2.first_name," ", employee2.last_name) as manager FROM employee 
        LEFT JOIN employee employee2 ON employee2.id = employee.manager_id WHERE CONCAT(employee2.first_name," ", employee2.last_name) is NOT NULL;
         `, function (err, data) {
            resolve(data);
        });
    });
};
function lookupId(tableName, condition) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id FROM  ${tableName} WHERE ${condition}`, function (err, data) {
            resolve(data);
        });
    });
};
function viewAll() {
    connection.query(`SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, 
    CONCAT(employee2.first_name, " ", employee2.last_name) manager FROM employee
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON department.id = role.department_id
    LEFT JOIN employee employee2 ON employee2.id = employee.manager_id`, function (err, data) {
        console.table(data);
        menu();
    });
};
function viewByDepartment() {
    lookupDepartment().then(data => {
        departmentList = data.map(department => department.name);
        inquirer.prompt(
            {
                type: "rawlist",
                name: "departmentName",
                message: "Which department would you like to view?",
                choices: departmentList
            }
        ).then(answer => {
            connection.query(`SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary, 
            CONCAT(employee2.first_name, " ", employee2.last_name) manager FROM employee
            LEFT JOIN role ON employee.role_id = role.id
            LEFT JOIN department ON department.id = role.department_id
            LEFT JOIN employee employee2 ON employee2.id = employee.manager_id WHERE department.name = "${answer.departmentName}";`, function (err, data) {
                console.table(data);
                menu();
            });
        });
    });
};
function viewByManager() {
    lookupManager().then(data => {   
        managerList = data.map(manager => manager.manager);
        inquirer.prompt(
            {
                type: "rawlist",
                name: "managerName",
                message: "Which manager would you like to view?",
                choices: managerList
            }
        ).then(answer => {
            connection.query(`SELECT employee.id, employee.first_name, employee.last_name, role.title, department.name as department, role.salary FROM employee
            LEFT JOIN role ON employee.role_id = role.id
            LEFT JOIN department ON department.id = role.department_id
            LEFT JOIN employee employee2 ON employee2.id = employee.manager_id WHERE CONCAT(employee2.first_name, " ", employee2.last_name) = "${answer.managerName}";`, function (err, data) {
                console.table(data);
                menu();
            });
        });
    });
};

function addEmployee() {
    inquirer.prompt([
        {
            type: "input",
            name: "firstName",
            message: "Enter employee's first name:"
        },
        {
            type: "input",
            name: "lastName",
            message: "Enter employee's last name:"
        },
        {
            type: "input",
            name: "role",
            message: "Enter employee's role id:",
            validate: function(value) {
                if (isNaN(value) === false){
                    return true;
                }
                return false;
            }
        },
        {
            type: "input",
            name: "manager",
            message: "Enter employee's manager id:",
            validate: function(value){
                if (isNaN(value) === false) {
                    return true;
                }
                return false;
            }
        }
    ]).then(answer => {
        connection.query(
            "INSERT INTO employee SET ?",
            {
                first_name: answer.firstName,
                last_name: answer.lastName,
                role_id: answer.role,
                manager_id: answer.manager
            },
            function (err) {
                if (err) throw err;
                console.log(`Successfully added ${answer.firstName} ${answer.lastName} to database`);
                menu();
            }
        );
    });
};
function addDepartment() {
    inquirer.prompt(
        {
            type: "input",
            name: "name",
            message: "Please enter new department name:"
        }
    ).then(answer => {
        connection.query(
            `INSERT INTO department SET name = "${answer.name}"`, function(err) {
                console.log('Successfully added new department!');
                menu();
            }
        );
    });
};
function addRole() {
    inquirer.prompt([
        {
            type: "input",
            name: "name",
            message: "Please enter new role:"
        },
        {
            type: "input",
            name: "salary",
            message: "Please enter salary for this role:",
            validate: function(value) {
                if (isNaN(value) === false){
                    return true;
                }
                return false;
            }
        },
        {
            type: "input",
            name: "department",
            message: "Please enter department id:",
            validate: function(value) {
                if (isNaN(value) === false) {
                    return true;
                }
                return false;
            }
        }
    ]).then(answer => {
        connection.query(
            `INSERT INTO role SET ?`,
            {
                title: answer.name,
                salary: answer.salary,
                department_id: answer.department
            }, function(err) {
                console.log('Successfully added new role!');
                menu();
            }
        );
    });
};
function removeEmployee() {
    lookupName().then(data => {
        employeeList = data.map(employee => employee.first_name + " " + employee.last_name);
        inquirer.prompt(
            {
                type: "rawlist",
                name: "name",
                message: "Who would you like to remove?",
                choices: employeeList
            }
        ).then(answer => {
            let fullName = answer.name.split(" ");
            let firstname = fullName[0];
            let lastname = fullName[1];
            connection.query(`DELETE FROM employee WHERE first_name = "${firstname}" AND last_name = "${lastname}";`, function (err, data) {
                console.log(`Successfully removed ${firstname} ${lastname}!`);
                menu();
            });
        });
    });
};
function removeDepartment(){
    lookupDepartment().then(data => {
        departmentList = data.map(department => department.name);
        inquirer.prompt(
            {
                type: "rawlist",
                name: "name",
                message: "Which department would you like to remove?",
                choices: departmentList
            }
        ).then(answer => {
            connection.query(`DELETE FROM department WHERE name = "${answer.name}";`, function(err){
                console.log(`Successfully removed ${answer.name}`);
                menu();
            });
        });
    });
};
function removeRole(){
    lookupRole().then(data => {
        roleList = data.map(role => role.title);
        inquirer.prompt(
            {
                type: "rawlist",
                name: "name",
                message: "Which role would you like to remove?",
                choices: roleList
            }
        ).then(answer => {
            connection.query(`DELETE FROM role WHERE title = "${answer.name}";`, function(err) {
                console.log(`Successfully removed ${answer.name}`);
                menu();
            })
        })
    })
}
function updateRole() {
    var roleList = [];
    lookupName().then(data => {
        employeeList = data.map(employee => employee.first_name + " " + employee.last_name);
        lookupRole().then(data => {
            roleList = data.map(role => role.title);
            inquirer.prompt([
                {
                    type: "rawlist",
                    name: "name",
                    message: "Who would you like to update role?",
                    choices: employeeList
                },
                {
                    type: "rawlist",
                    name: "newRole",
                    message: "Which role would you like to update?",
                    choices: roleList
                }
            ]).then(answer => {
                let fullName = answer.name.split(" ");
                let firstname = fullName[0];
                let lastname = fullName[1];
                let condition = `first_name = "${firstname}" AND last_name = "${lastname}"`;
                lookupId("employee", condition).then(data => {
                    let employeeId = data[0].id;
                    condition = `title = "${answer.newRole}"`;
                    lookupId("role", condition).then(data => {
                        let roleId = data[0].id;
                        connection.query(`UPDATE employee SET role_id = ${roleId} WHERE id = ${employeeId};`, function (err, data) {
                            console.log("Successfully updated!")
                            menu();
                        })
                    });
                });
            });
        });
    });
};
function updateManager() {
    lookupName().then(data => {
        employeeList = data.map(employee => employee.first_name + " " + employee.last_name);
        inquirer.prompt([
            {
                type: "rawlist",
                name: "name",
                message: "Who would you like to update manager?",
                choices: employeeList
            },
            {
                type: "rawlist",
                name: "newManager",
                message: "Choose new manager:",
                choices: employeeList
            }
        ]).then(answer => {
            let newManagerFullName = answer.newManager.split(" ");
            let newManagerFirstname = newManagerFullName[0];
            let newManagerLastname = newManagerFullName[1];
            let fullName = answer.name.split(" ");
            let firstname = fullName[0];
            let lastname = fullName[1];
            let condition = `first_name ="${newManagerFirstname}" AND last_name = "${newManagerLastname}"`;
            lookupId('employee', condition).then(data => {
                let newManagerId = data[0].id;
                connection.query(`UPDATE employee SET manager_id = ${newManagerId} WHERE first_name = "${firstname}" AND last_name = "${lastname}";`, function (err, data) {
                    console.log("Successfully updated!");
                    menu();
                });
            });
        });
    });
};
function viewBudget(){
    lookupDepartment().then(data => {
        departmentList = data.map(department => department.name);
        inquirer.prompt(
            {
                type: "rawlist",
                name: "name",
                message: "Which department would you like to view total utilized budget?",
                choices: departmentList
            }
        ).then(answer => {
            lookupId("department", `name = "${answer.name}";`).then(data => {
                connection.query(`SELECT salary FROM role WHERE department_id = ${data[0].id};`, function(err, salary) {
                    var totalSalary = 0;
                    for (let i = 0; i< salary.length; i++) {
                        totalSalary += salary[i].salary;
                    }
                    console.log(`The total utilized budget of ${answer.name} department is ${totalSalary} dollars`);
                    menu();
                })
            })
        })
    })
}