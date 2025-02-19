import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import { NavLink } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import Alert from "react-bootstrap/Alert";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const Home = () => {
  const [data, setData] = useState([]);
  const [show, setShow] = useState(false);

  // Fetch User Data
  const getUserData = async () => {
    try {
      const res = await axios.get("http://localhost:8005/getdata", {
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 201) {
        setData(res.data.getUser);
      } else {
        console.log("Error fetching data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Delete User
  const dltUser = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:8005/${id}`, {
        headers: { "Content-Type": "application/json" },
      });

      if (res.status === 201) {
        getUserData();
        setShow(true);
      } else {
        console.log("Error deleting user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <Container className="mt-4">
      {show && (
        <Alert
          variant="danger"
          onClose={() => setShow(false)}
          dismissible
          className="text-center fw-bold"
        >
          User Deleted Successfully
        </Alert>
      )}

      <h1 className="text-center fw-bold mb-4"> Image Upload Project</h1>

      <div className="text-end mb-4">
        <Button variant="success" size="lg">
          <NavLink to="/register" className="text-decoration-none text-light">
            + Add User
          </NavLink>
        </Button>
      </div>

      <Row className="g-4 d-flex justify-content-center">
        {data.length > 0 ? (
          data.map((el, i) => (
            <Col key={el._id || i} sm={12} md={6} lg={4} xl={3}>
              <Card
                className="shadow-sm border-0 rounded-4 p-3 text-center"
                style={{
                  backgroundColor: "rgb(190 223 255)", // Light background color
                  transition: "0.3s ease-in-out",
                }}
              >
                <Card.Img
                  variant="top"
                  src={`http://localhost:8005/uploads/${el.imgpath}`}
                  className="rounded-circle mx-auto mt-3"
                  style={{
                    width: "120px",
                    height: "120px",
                    objectFit: "cover",
                  }}
                />
                <Card.Body>
                  <Card.Title className="fw-bold">{el.name}</Card.Title>
                  <Card.Text className="text-muted">
                    Date Added:{" "}
                    {el.date && moment(el.date, moment.ISO_8601, true).isValid()
                      ? moment(el.date).format("LL")
                      : "No Date Available"}
                  </Card.Text>
                  <Button
                    variant="danger"
                    className="w-100 fw-bold"
                    onClick={() => dltUser(el._id)}
                  >
                    Delete
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <h3 className="text-center text-muted">No Users Found</h3>
        )}
      </Row>
    </Container>
  );
};

export default Home;
