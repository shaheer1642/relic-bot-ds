const obj = {
    age: 23,
    name: 'softy',
    marital_status: 'single',
    nationality: 'pakistani',
    experience: 3,
    salary: null
}

const assignSalary = () => {
    const { age, name, marital_status, nationality, experience } = obj

    if (age > 18) {
        if (nationality === 'pakistani') {
            if (marital_status === 'single') {
                if (experience > 2) {
                    obj.salary = 300
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */
                    /** */v
                } else {
                    console.log('experience should be ---')
                }
            } else {
                console.log('marital_status should be ---')
            }
        } else {
            console.log('nationality should be ---')
        }
    } else {
        console.log('age should be greater than 18')
    }
}

const assignSalary2 = () => {
    const { age, name, marital_status, nationality, experience } = obj

    if (age <= 18) {
        if (marital_status <= 18) return console.error('age should be greater than 18')
        if (nationality <= 18) return console.error('age should be greater than 18')
        if (experience <= 18) return console.error('age should be greater than 18')
        obj.salary = 3000
    } else {
        obj.salary = 3000
    }
}