import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Alert from "react-bootstrap/Alert";
import Card from "react-bootstrap/Card";

const Register = () => {
  const [name, setName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" });
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file)); // Show preview
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
    multiple: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !image) {
      setAlert({
        show: true,
        message: "Please fill in all fields!",
        variant: "danger",
      });
      return;
    }

    const formData = new FormData();
    formData.append("photo", image);
    formData.append("name", name);

    try {
      const res = await axios.post("http://localhost:8005/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === 401 || !res.data) {
        setAlert({
          show: true,
          message: "Error in registration",
          variant: "danger",
        });
      } else {
        setAlert({
          show: true,
          message: "User Registered Successfully!",
          variant: "success",
        });
        setTimeout(() => navigate("/"), 2000);
      }
    } catch (error) {
      setAlert({
        show: true,
        message: "Something went wrong!",
        variant: "danger",
      });
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center vh-100">
      <Card
        className="shadow-lg p-4 rounded-4"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <Card.Body>
          {alert.show && (
            <Alert
              variant={alert.variant}
              onClose={() => setAlert({ show: false })}
              dismissible
            >
              {alert.message}
            </Alert>
          )}
          <h2 className="text-center fw-bold mb-4">Register User</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">User Name</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter username"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Your Image</Form.Label>
              <div
                {...getRootProps()}
                className="dropzone border rounded p-3 text-center"
                style={{ cursor: "pointer", backgroundColor: "#f8f9fa" }}
              >
                <input {...getInputProps()} />
                {isDragActive ? (
                  <p>Drop the file here...</p>
                ) : (
                  <p>Drag & drop an image, or click to select one</p>
                )}
              </div>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-3 rounded"
                  style={{ width: "100%", height: "auto" }}
                />
              )}
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100 fw-bold">
              Submit
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;
