import { useState, useEffect } from "preact/hooks"

const colors = {
    error: "#FF0033"
}

export const Button = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            type: "button",
            key: "",
            name: "",
            onClick: () => {},
            style: {},
            fullWidth: false,
            disabled: false,
            visible: true,
            variant: "",
            color: "",
            class: "default",
            size: "default",
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.style['display'] = newObject.visible ? 'block' : 'none'
        newObject.class = newObject.class + " " + newObject.variant + ' ' + newObject.color + ' ' + newObject.size

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <button
                    key={object.key} 
                    type={object.type}
                    name={object.name}
                    onClick={object.onClick}
                    style={object.style}
                    disabled={object.disabled}
                    class={object.class}
                >
                    {object.children}
                </button> 
            }
        </>
    )
}

export const Input = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            type: "text",
            placeholder: "",
            key: "",
            name: "",
            value: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            error: false,
            disabled: false,
            readOnly: false,
            required: false,
            step: 1,
            autoFocus: false,
            label: "",
            helperText: "",
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : ''
        newObject.style['borderColor'] = newObject.error ? colors.error : 'auto'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object &&
                <div  
                    class={`input ${object.type}`}
                    style={object.style}
                >
                    <div>
                    {
                        object.label &&
                        <label htmlFor={object.name}>{object.label}</label>
                    }
                    {
                        <input
                            key={object.key} 
                            type={object.type}
                            placeholder={object.placeholder}
                            name={object.name}
                            value={object.value}
                            onInput={object.onChange}
                            style={object.style}
                            disabled={object.disabled}
                            readOnly={object.readOnly}
                            required={object.required}
                            step={object.step}
                            autoFocus={object.autoFocus}
                        /> 
                    }
                    </div>
                    {
                        object.helperText &&
                        <p>{object.helperText}</p>
                    }
                </div>
            }
        </>
    )
}

export const Checkbox = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            type: "checkbox",
            placeholder: "",
            key: "",
            name: "",
            value: false,
            onChange: () => {},
            style: {},
            fullWidth: false,
            error: false,
            disabled: false,
            readOnly: false,
            required: false,
            step: 1,
            autoFocus: false,
            label: "",
            helperText: "",
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : ''
        newObject.style['borderColor'] = newObject.error ? colors.error : 'auto'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object &&
                <div  
                    class={`input checkbox`}
                    style={object.style}
                >
                    <div>
                    {
                        object.label &&
                        <label htmlFor={object.name}>{object.label}</label>
                    }
                    {
                        <input
                            key={object.key} 
                            type={object.type}
                            placeholder={object.placeholder}
                            name={object.name}
                            value={object.value}
                            checked={object.value}
                            onInput={object.onChange}
                            style={object.style}
                            disabled={object.disabled}
                            readOnly={object.readOnly}
                            required={object.required}
                            step={object.step}
                            autoFocus={object.autoFocus}
                        /> 
                    }
                    </div>
                    {
                        object.helperText &&
                        <p>{object.helperText}</p>
                    }
                </div>
            }
        </>
    )
}

export const Select = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            key: "",
            name: "",
            value: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            disabled: false,
            readOnly: false,
            required: false,
            autoFocus: false,
            children: [],
            label: "",
            helperText: "",
        }

        // omit onSubmit function from props
        const {onSubmit, ...rest} = props

        const newObject = {...defaultObject, ...rest}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            { object &&
            <div class="input">
                <label htmlFor={object.name}>{object.label}</label>
                <select
                    key={object.key} 
                    name={object.name}
                    value={object.value}
                    onInput={object.onChange}
                    style={object.style}
                    disabled={object.disabled}
                    readOnly={object.readOnly}
                    required={object.required}
                    autoFocus={object.autoFocus}
                >
                    {object.children}
                </select> 
                <p>{object.helperText}</p>
            </div>
            }
        </>
    )
}

export const TextArea = (props) => {
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultObject = {
            key: "",
            name: "",
            value: "",
            placeholder: "",
            onChange: () => {},
            style: {},
            fullWidth: false,
            error: false,
            disabled: false,
            readOnly: false,
            required: false,
            autoFocus: false,
            rows: 4,
            cols: 0,
            resize: false,
        }

        const newObject = {...defaultObject, ...props}

        newObject.style['width'] = newObject.fullWidth ? '100%' : 'auto'
        newObject.style['borderColor'] = newObject.error ? colors.error : 'auto'
        newObject.style['resize'] = newObject.resize ? 'vertical' : 'none'

        setObject(newObject)
    }, [props])

    
    return (
        <>
            {
                object && 
                <textarea
                    key={object.key} 
                    name={object.name}
                    placeholder={object.placeholder}
                    value={object.value}
                    onInput={object.onChange}
                    style={object.style}
                    disabled={object.disabled}
                    readOnly={object.readOnly}
                    required={object.required}
                    autoFocus={object.autoFocus}
                    rows={object.rows}
                    cols={object.cols}
                /> 
            }
        </>
    )
}

export const Dialog = (props) => {
    const [object, setObject] = useState(null)
    const [open, setOpen] = useState(false)

    const openDialog = () => {
        object.onOpen && object.onOpen()
        setOpen(true)
    }

    const closeDialog = () => {
        object.onClose && object.onClose()
        setOpen(false)
    }

    const handleSubmit = () => {
        object.onSubmit()
        closeDialog()
    }

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this?")) {
            object.onDelete()
            closeDialog()
        }
    }

    useEffect(() => {
        const defaultObject = {
            title: "",
            style: {},
            fullScreen: false,
            onSubmit: null,
            class: "dialog",
            buttonText: "",
            buttonSettings: {
                variant: "contained",
                color: "primary",
                size: "slim",
                fullWidth: false,
                hidden: false,
            }
        }

        const newObject = {...defaultObject, ...props}

        newObject.buttonText = newObject.buttonText === "" ? newObject.title : newObject.buttonText

        if (props.buttonSettings) {
            newObject.buttonSettings = {...defaultObject.buttonSettings, ...props.buttonSettings}
        }

        if (props.open) {
            setOpen(props.open)
        }

        setObject(newObject)
    }, [props])
    
    return (
        <>
            {
                object && 
                <>
                    <div 
                        class={object.class + " " + (open ? "active" : "")}
                        style={object.style}
                    >
                        <div class={`overlay ${open ? "active" : ""}`} onClick={closeDialog}>

                        </div>

                        <div 
                            class={`content ${object.fullScreen ? "full-screen" : ""}`}
                        >
                            <div class="header mb-10">
                                <h3>{object.title}</h3>
                            </div>
                            {object.children}
                            <div class="footer">
                                <div>
                                    <Button onClick={closeDialog}>Close</Button>
                                    {
                                        object.onDelete &&
                                        <Button 
                                            onClick={handleDelete}
                                            variant="contained"
                                            color="alert"
                                        >Delete</Button>
                                    }
                                </div>
                                {
                                    object.onSubmit &&
                                    <Button 
                                        onClick={handleSubmit}
                                        variant="contained"
                                        color="success"
                                    >Save</Button>
                                }
                            </div>
                        </div>
                        
                    </div>
                    
                    {
                        object.buttonSettings.hidden === false &&
                        <Button
                            variant={object.buttonSettings.variant}
                            color={object.buttonSettings.color}
                            size={object.buttonSettings.size}
                            fullWidth={object.buttonSettings.fullWidth}
                            onClick={openDialog}
                        >
                            {object.buttonText}
                        </Button>
                    }
                </>
            }
        </>
    )
}

export const Form = (props) => {
    const [settings, setSettings] = useState(null)
    const [object, setObject] = useState(null)

    useEffect(() => {
        const defaultSettings = {
            integrated: false,
        }

        // loop through props and set settings
        props && Object.keys(props).forEach(key => {
            if (defaultSettings[key] !== undefined) {
                defaultSettings[key] = props[key]
            }
        })

        const newSettings = {...defaultSettings}
        setSettings(newSettings)

        const newObject = {...props.object}
        setObject(newObject)
    }, [props])

    const handleChange = (e) => {
        const name = e.target.name
        let value = e.target.value

        if (e.target.type === "checkbox") {
            value = e.target.checked
        } 

        if (typeof object[name] === "number") {
            value = parseFloat(value)
        }  

        const newObject = {...object}
        newObject[name] = value
        setObject(newObject)
        props.onChange(newObject)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        props.onSubmit()
    }

    const StringisDate = (value) => {
        // check if string is a valid date
        const date = new Date(value)
        return date instanceof Date && !isNaN(date) && date.toISOString().slice(0,10) === value
    }
    const StringisDateTime = (value) => {
        // check if string is a valid datetime
        const date = new Date(value)
        const isDate = date instanceof Date && !isNaN(date)
        const isTime = value.split(':').length === 3
        const isDateTime =  isDate && isTime
        return isDateTime
    }

    const Field = ({label, value, onChange}) => {
        let type = typeof value

        // determine field types
        
        // else if value is date, time, datetime, etc.
       if (typeof value === "string" && StringisDate(value)) {
            type = "date"
        }
        else if (typeof value === "string" && StringisDateTime(value)) {
            type = "datetime-local"
        }

        else if (typeof value === "boolean") {
            return (
                <Checkbox 
                    name={label}
                    value={value}
                    onChange={onChange}
                />
            )
        }
        else if (typeof value === "string" && value.length > 50 || typeof value === "string" && value.includes("\n")) {
            return (
                <TextArea
                    name={label}
                    value={value}
                    onChange={onChange}
                />
            )
        }
        else if (Array.isArray(value)) {
            return (
                <Select 
                    name={label}
                    value={value}
                    onChange={onChange}
                >
                    {
                        value.map((item) => {
                            return (
                                <option value={item}>{item}</option>
                            )
                        })
                    }
                </Select>
            )
        }
        // future: add support for date, time, datetime, etc.
        // else if (typeof value === "object") {
        
        return (
            <Input 
                type={type}
                name={label}
                value={value}
                onChange={onChange}
                label={label}
            />
        )
    }

    const checkType = (value) => {
        let type = typeof value
    
         // else if value is date, time, datetime, etc.
        if (type === "string" && StringisDate(value)) {
            type = "date"
        }
        else if (type === "string" && StringisDateTime(value)) {
            type = "datetime-local"
        } else if (type === "boolean") {
            type = "checkbox"
        }
        else if (type === "string" && value.length > 50 || type === "string" && value.includes("\n")) {
            type = "textarea"
        }
        else if (Array.isArray(value)) {
            type = "select"
        }

        return type
    }

    return (
        <>
            {
                object && <form onSubmit={handleSubmit} class={`${settings && settings.integrated && 'integrated'}`}>
                     

                    {
                        object && Object.keys(object).map((key) => {
                            const value = object[key]
                            const type = checkType(value)

                            if (type === "select") {
                                return (
                                    <Select
                                        name={key}
                                        label={key}
                                        value={value}
                                        onChange={handleChange}
                                    >
                                        {
                                            value.map((item) => {
                                                return (
                                                    <option value={item}>{item}</option>
                                                )
                                            })
                                        }
                                    </Select>
                                )
                            } else if (type === "checkbox") {
                                return (
                                    <Checkbox 
                                        name={key}
                                        label={key}
                                        value={value}
                                        onChange={handleChange}
                                    />
                                )
                            } else if (type === "textarea") {
                                return (
                                    <TextArea
                                        name={key}
                                        label={key}
                                        value={value}
                                        onChange={handleChange}
                                    />
                                )
                            }

                            return (
                                <div>
                                    {/* <Field label={key} value={value} onChange={handleChange} /> */}
                                      
                                    <Input 
                                        type={type}
                                        name={key}
                                        label={key}
                                        value={value}
                                        onChange={handleChange}
                                    />
                                </div>
                            )
                        })
                    }

                    

                    {/* {object.children}
                    {
                        settings && !settings.integrated &&
                        <Button 
                            type="submit"
                            variant="contained"
                            color="primary"
                            fullWidth={true}
                        >Submit</Button>
                    } */}
                </form>
            }
        </>
    )
}